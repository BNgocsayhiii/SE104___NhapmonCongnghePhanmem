import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireSession, writeAuditLog } from '@/lib/api'
import { formatZodError, wasteCreateSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response
    const filterType = req.nextUrl.searchParams.get('filterType') || 'month'
    const filterValue = req.nextUrl.searchParams.get('filterValue') || ''
    let wasteDateFilter: { gte?: Date; lt?: Date } | undefined
    if (filterValue) {
      if (filterType === 'day') {
        const start = new Date(`${filterValue}T00:00:00`)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        wasteDateFilter = { gte: start, lt: end }
      } else if (filterType === 'year') {
        const year = Number(filterValue)
        if (Number.isInteger(year)) wasteDateFilter = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) }
      } else {
        const [year, month] = filterValue.split('-').map(Number)
        if (year && month) wasteDateFilter = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) }
      }
    }

    const [batches, wasteLogs] = await Promise.all([
      prisma.batch.findMany({
        where: { effectiveRemaining: { gt: 0 }, status: { in: ['FRESH', 'NEAR_EXPIRY', 'EXPIRED'] } },
        orderBy: [{ expiredAt: 'asc' }, { createdAt: 'asc' }],
        include: {
          product: { select: { name: true, unit: true } },
          importReceipt: { include: { supplier: { select: { name: true } } } },
        },
      }),
      prisma.wasteLog.findMany({
        where: wasteDateFilter ? { createdAt: wasteDateFilter } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          batch: { include: { product: { select: { name: true, unit: true } } } },
          createdBy: { select: { fullName: true } },
        },
      }),
    ])

    const today = new Date()
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const [todayWaste, monthWaste] = await Promise.all([
      prisma.wasteLog.aggregate({ where: { createdAt: { gte: start } }, _sum: { quantity: true }, _count: { id: true } }),
      prisma.wasteLog.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { quantity: true }, _count: { id: true } }),
    ])

    return apiSuccess({
      batches: batches.map(batch => ({
        id: batch.id,
        batchCode: batch.batchCode,
        productName: batch.product.name,
        unit: batch.product.unit,
        supplierName: batch.importReceipt.supplier.name,
        remaining: batch.remaining,
        effectiveRemaining: batch.effectiveRemaining,
        importPrice: batch.importPrice,
        expiredAt: batch.expiredAt.toISOString(),
        status: batch.status,
      })),
      wasteLogs: wasteLogs.map(log => ({
        id: log.id,
        batchCode: log.batch.batchCode,
        productName: log.batch.product.name,
        unit: log.batch.product.unit,
        quantity: log.quantity,
        reason: log.reason,
        note: log.note,
        createdByName: log.createdBy.fullName,
        createdAt: log.createdAt.toISOString(),
        cost: log.quantity * log.batch.importPrice,
      })),
      summary: {
        todayCount: todayWaste._count.id,
        todayQuantity: todayWaste._sum.quantity ?? 0,
        monthCount: monthWaste._count.id,
        monthQuantity: monthWaste._sum.quantity ?? 0,
      },
    })
  } catch (error) {
    console.error('[GET /api/kho-hang/huy-hang] Error:', error)
    return apiError('Không tải được dữ liệu hủy hàng')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    const parsed = wasteCreateSchema.safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })
    const { batchId, quantity, reason, note } = parsed.data

    const wasteLog = await prisma.$transaction(async tx => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        select: { id: true, remaining: true, effectiveRemaining: true, importPrice: true, status: true },
      })
      if (!batch) throw new Error('Lô hàng không tồn tại')
      if (quantity > batch.effectiveRemaining) throw new Error('Số lượng hủy vượt quá tồn thực tế')

      const nextRemaining = Math.max(batch.remaining - quantity, 0)
      const nextEffective = Math.max(batch.effectiveRemaining - quantity, 0)

      await tx.batch.update({
        where: { id: batchId },
        data: {
          remaining: nextRemaining,
          effectiveRemaining: nextEffective,
          ...(nextEffective === 0 ? { status: 'DISPOSED' } : {}),
        },
      })

      const createdWasteLog = await tx.wasteLog.create({
        data: {
          batchId,
          quantity,
          reason,
          note,
          createdById: session.id,
        },
        include: {
          batch: { include: { product: { select: { name: true, unit: true } } } },
          createdBy: { select: { fullName: true } },
        },
      })

      await writeAuditLog(tx, {
        userId: session.id,
        action: 'CREATE_WASTE_LOG',
        target: 'WasteLog',
        targetId: createdWasteLog.id,
        newValue: {
          batchId,
          quantity,
          reason,
          before: batch,
          after: { remaining: nextRemaining, effectiveRemaining: nextEffective },
        },
      })

      return createdWasteLog
    })

    return apiSuccess(wasteLog, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không hủy được hàng'
    const status = ['Lô hàng không tồn tại', 'Số lượng hủy vượt quá tồn thực tế'].includes(message) ? 400 : 500
    console.error('[POST /api/kho-hang/huy-hang] Error:', error)
    return apiError(message, { status })
  }
}
