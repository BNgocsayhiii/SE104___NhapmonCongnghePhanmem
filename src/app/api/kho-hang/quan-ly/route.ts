import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')

async function getSession(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null

  const { payload } = await jwtVerify(token, SECRET)
  return {
    id: payload.id as string,
    role: payload.role as string,
  }
}

function getDaysLeft(expiredAt: Date) {
  return Math.ceil((expiredAt.getTime() - Date.now()) / 86400000)
}

function displayStatus(status: string, daysLeft: number) {
  if (daysLeft < 0) return 'EXPIRED'
  if (daysLeft <= 2 && status !== 'DISPOSED') return 'NEAR_EXPIRY'
  return status
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    if (session.role === 'STAFF_SALES') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xem kho' }, { status: 403 })
    }

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

    return NextResponse.json({
      success: true,
      data: {
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
      },
    })
  } catch (error) {
    console.error('[GET /api/kho-hang/quan-ly] Error:', error)
    return NextResponse.json({ success: false, error: 'Không tải được dữ liệu kho' }, { status: 500 })
  }
}
