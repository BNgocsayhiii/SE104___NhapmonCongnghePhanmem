import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiMessage, apiSuccess, requireSession, writeAuditLog } from '@/lib/api'
import { formatZodError, stockAdjustmentSchema } from '@/lib/validations'

function getDaysLeft(expiredAt: Date) {
  return Math.ceil((expiredAt.getTime() - Date.now()) / 86400000)
}

function displayStatus(status: string, daysLeft: number) {
  if (daysLeft < 0) return 'EXPIRED'
  if (daysLeft <= 2 && status !== 'DISPOSED') return 'NEAR_EXPIRY'
  return status
}

async function refreshBatchHealth() {
  const now = new Date()
  const batches = await prisma.batch.findMany({
    where: { effectiveRemaining: { gt: 0 }, status: { not: 'DISPOSED' } },
    include: { product: { select: { evaporationRate: true } } },
  })

  await Promise.all(batches.map(batch => {
    const daysSincePackaged = Math.max(0, Math.floor((now.getTime() - batch.packagedAt.getTime()) / 86400000))
    const evaporationLoss = batch.product.evaporationRate > 0
      ? batch.quantity * (batch.product.evaporationRate / 100) * daysSincePackaged
      : 0
    const effectiveRemaining = Math.max(0, Math.min(batch.remaining, batch.remaining - evaporationLoss))
    const daysLeft = getDaysLeft(batch.expiredAt)
    const status = displayStatus(batch.status, daysLeft)

    if (Math.abs(effectiveRemaining - batch.effectiveRemaining) < 0.001 && status === batch.status) return null
    return prisma.batch.update({
      where: { id: batch.id },
      data: { effectiveRemaining, status: status as 'FRESH' | 'NEAR_EXPIRY' | 'EXPIRED' | 'DISPOSED' },
    })
  }))
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    await refreshBatchHealth()

    const search = req.nextUrl.searchParams.get('search')?.trim().toLowerCase()
    const status = req.nextUrl.searchParams.get('status') || ''

    const batches = await prisma.batch.findMany({
      where: {
        effectiveRemaining: { gt: 0 },
      },
      include: {
        product: { include: { category: { select: { name: true } } } },
        importReceipt: { include: { supplier: { select: { name: true } }, receivedBy: { select: { fullName: true } } } },
      },
    })

    const mapped = batches
      .map(batch => {
        const daysLeft = getDaysLeft(batch.expiredAt)
        const statusText = displayStatus(batch.status, daysLeft)
        const stockRatio = batch.quantity > 0 ? batch.effectiveRemaining / batch.quantity : 0
        return {
          id: batch.id,
          batchCode: batch.batchCode,
          receiptCode: batch.importReceipt.receiptCode,
          productName: batch.product.name,
          sku: batch.product.sku,
          categoryName: batch.product.category.name,
          supplierName: batch.importReceipt.supplier.name,
          receivedByName: batch.importReceipt.receivedBy.fullName,
          unit: batch.product.unit,
          quantity: batch.quantity,
          remaining: batch.remaining,
          effectiveRemaining: batch.effectiveRemaining,
          importPrice: batch.importPrice,
          sellPrice: batch.product.currentPrice,
          inventoryValue: batch.effectiveRemaining * batch.importPrice,
          packagedAt: batch.packagedAt.toISOString(),
          expiredAt: batch.expiredAt.toISOString(),
          daysLeft,
          status: statusText,
          stockRatio,
          priorityScore: (daysLeft < 0 ? -100 : daysLeft) + stockRatio,
        }
      })
      .filter(batch => {
        if (status && status !== 'ALL' && batch.status !== status) return false
        if (!search) return true
        return `${batch.productName} ${batch.sku} ${batch.batchCode} ${batch.supplierName}`.toLowerCase().includes(search)
      })
      .sort((a, b) => a.priorityScore - b.priorityScore)

    const totalInventoryValue = mapped.reduce((sum, batch) => sum + batch.inventoryValue, 0)
    const totalEffectiveRemaining = mapped.reduce((sum, batch) => sum + batch.effectiveRemaining, 0)
    const expiringCount = mapped.filter(batch => batch.daysLeft >= 0 && batch.daysLeft <= 2).length
    const expiredCount = mapped.filter(batch => batch.daysLeft < 0).length
    const lowStockCount = mapped.filter(batch => batch.stockRatio <= 0.2).length
    const freshCount = mapped.filter(batch => batch.status === 'FRESH').length

    const byProduct = Object.values(mapped.reduce<Record<string, {
      productName: string
      unit: string
      totalRemaining: number
      totalValue: number
      batchCount: number
    }>>((acc, batch) => {
      if (!acc[batch.productName]) {
        acc[batch.productName] = {
          productName: batch.productName,
          unit: batch.unit,
          totalRemaining: 0,
          totalValue: 0,
          batchCount: 0,
        }
      }
      acc[batch.productName].totalRemaining += batch.effectiveRemaining
      acc[batch.productName].totalValue += batch.inventoryValue
      acc[batch.productName].batchCount += 1
      return acc
    }, {})).sort((a, b) => b.totalValue - a.totalValue)

    return apiSuccess({
        summary: {
          batchCount: mapped.length,
          totalInventoryValue,
          totalEffectiveRemaining,
          expiringCount,
          expiredCount,
          lowStockCount,
          freshCount,
        },
        batches: mapped,
        byProduct,
    })
  } catch (error) {
    console.error('[GET /api/kho-hang/quan-ly] Error:', error)
    return apiError('Không tải được dữ liệu kho')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    const parsed = stockAdjustmentSchema.safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })
    const { batchId, after, reason } = parsed.data

    const result = await prisma.$transaction(async tx => {
      const batch = await tx.batch.findUnique({ where: { id: batchId } })
      if (!batch) throw new Error('Lô hàng không tồn tại')

      const adjustment = await tx.stockAdjustment.create({
        data: {
          batchId,
          before: batch.effectiveRemaining,
          after,
          delta: after - batch.effectiveRemaining,
          reason,
          createdById: session.id,
        },
      })

      const updated = await tx.batch.update({
        where: { id: batchId },
        data: {
          remaining: after,
          effectiveRemaining: after,
          status: after <= 0 ? 'DISPOSED' : batch.status,
        },
      })

      await writeAuditLog(tx, {
        userId: session.id,
        action: 'STOCK_ADJUSTMENT',
        target: 'Batch',
        targetId: batchId,
        oldValue: batch,
        newValue: { adjustment, batch: updated },
      })

      return { adjustment, batch: updated }
    })

    return apiMessage('Đã điều chỉnh tồn kho', result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không điều chỉnh được tồn kho'
    const status = message === 'Lô hàng không tồn tại' ? 404 : 500
    console.error('[PATCH /api/kho-hang/quan-ly] Error:', error)
    return apiError(message, { status })
  }
}
