import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ReportRange = 'day' | 'month' | 'quarter' | 'year'

function readInt(value: string | null, fallback: number) {
  const num = Number(value)
  return Number.isInteger(num) ? num : fallback
}

function parseDateValue(value: string | null, fallback: Date) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  return new Date(year, month, day)
}

function parseMonthValue(value: string | null, fallback: Date) {
  const match = value?.match(/^(\d{4})-(\d{2})$/)
  if (!match) return new Date(fallback.getFullYear(), fallback.getMonth(), 1)

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  return new Date(year, month, 1)
}

function getReportPeriod(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const rangeParam = searchParams.get('range')
  const range: ReportRange = rangeParam === 'day' || rangeParam === 'quarter' || rangeParam === 'year'
    ? rangeParam
    : 'month'
  const now = new Date()

  if (range === 'day') {
    const start = parseDateValue(searchParams.get('date'), now)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { range, start, end }
  }

  if (range === 'month') {
    const start = parseMonthValue(searchParams.get('month'), now)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    return { range, start, end }
  }

  if (range === 'quarter') {
    const year = readInt(searchParams.get('year'), now.getFullYear())
    const quarter = Math.min(Math.max(readInt(searchParams.get('quarter'), Math.floor(now.getMonth() / 3) + 1), 1), 4)
    const start = new Date(year, (quarter - 1) * 3, 1)
    const end = new Date(year, quarter * 3, 1)
    return { range, start, end }
  }

  const year = readInt(searchParams.get('year'), now.getFullYear())
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)
  return { range, start, end }
}

export async function GET(req: NextRequest) {
  try {
    const period = getReportPeriod(req)
    const dateFilter = { gte: period.start, lt: period.end }

    const invoiceStats = await prisma.invoice.aggregate({
      where: { createdAt: dateFilter, status: 'PAID' },
      _sum: { finalAmount: true, discount: true, totalAmount: true },
      _count: { id: true }
    })

    const soldItems = await prisma.invoiceItem.findMany({
      where: { invoice: { createdAt: dateFilter, status: 'PAID' } },
      select: { quantity: true, batch: { select: { importPrice: true } } }
    })

    const totalCOGS = soldItems.reduce((sum, item) => sum + (item.quantity * item.batch.importPrice), 0)
    const revenue = invoiceStats._sum.finalAmount ?? 0
    const profit = revenue - totalCOGS

    const channelsData = await prisma.invoice.groupBy({
      by: ['channel'],
      where: { createdAt: dateFilter, status: 'PAID' },
      _sum: { finalAmount: true }
    })

    const paymentsData = await prisma.invoice.groupBy({
      by: ['paymentMethod'],
      where: { createdAt: dateFilter, status: 'PAID' },
      _sum: { finalAmount: true }
    })

    const wasteLogs = await prisma.wasteLog.findMany({
      where: { createdAt: dateFilter },
      select: { quantity: true, reason: true, batch: { select: { importPrice: true } } }
    })

    const wasteSummary = { EXPIRED: 0, DAMAGED: 0, BIOLOGICAL: 0, PROMOTION: 0, OTHER: 0 }
    let totalWasteCost = 0

    wasteLogs.forEach(log => {
      const cost = log.quantity * log.batch.importPrice
      if (log.reason in wasteSummary) {
        wasteSummary[log.reason as keyof typeof wasteSummary] += cost
      }
      totalWasteCost += cost
    })

    const activeBatches = await prisma.batch.findMany({
      where: { remaining: { gt: 0 }, status: { in: ['FRESH', 'NEAR_EXPIRY'] } },
      select: { remaining: true, importPrice: true }
    })
    const totalInventoryValue = activeBatches.reduce((sum, b) => sum + (b.remaining * b.importPrice), 0)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          invoiceCount: invoiceStats._count.id,
          revenue,
          profit,
          discount: invoiceStats._sum.discount ?? 0,
          totalWasteCost,
          totalInventoryValue
        },
        channels: channelsData.map(c => ({ name: c.channel, value: c._sum.finalAmount ?? 0 })),
        payments: paymentsData.map(p => ({ name: p.paymentMethod, value: p._sum.finalAmount ?? 0 })),
        waste: Object.entries(wasteSummary).map(([reason, cost]) => ({ reason, cost }))
      }
    })
  } catch (error) {
    console.error('[GET /api/bao-cao] Error:', error)
    return NextResponse.json({ success: false, error: 'Không thể tải dữ liệu báo cáo' }, { status: 500 })
  }
}
