import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // 1. LẤY BỘ LỌC THỜI GIAN TỪ URL (Mặc định là 'month')
    const searchParams = req.nextUrl.searchParams
    const range = searchParams.get('range') || 'month'

    const now = new Date()
    let startDate = new Date()

    // 2. TÍNH MỐC THỜI GIAN BẮT ĐẦU DỰA VÀO RANGE
    if (range === 'day') {
      startDate.setHours(0, 0, 0, 0) // Từ 00:00:00 hôm nay
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1) // Ngày 1 của tháng này
    } else if (range === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1) // Ngày 1 của tháng đầu quý
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1) // Ngày 1/1 năm nay
    }

    // 3. THỰC THI TRUY VẤN VỚI MỐC startDate MỚI
    const invoiceStats = await prisma.invoice.aggregate({
      where: { createdAt: { gte: startDate }, status: 'PAID' },
      _sum: { finalAmount: true, discount: true, totalAmount: true },
      _count: { id: true }
    })

    const soldItems = await prisma.invoiceItem.findMany({
      where: { invoice: { createdAt: { gte: startDate }, status: 'PAID' } },
      select: { quantity: true, batch: { select: { importPrice: true } } }
    })
    
    const totalCOGS = soldItems.reduce((sum, item) => sum + (item.quantity * item.batch.importPrice), 0)
    const revenue = invoiceStats._sum.finalAmount ?? 0
    const profit = revenue - totalCOGS

    const channelsData = await prisma.invoice.groupBy({
      by: ['channel'],
      where: { createdAt: { gte: startDate }, status: 'PAID' },
      _sum: { finalAmount: true }
    })

    const paymentsData = await prisma.invoice.groupBy({
      by: ['paymentMethod'],
      where: { createdAt: { gte: startDate }, status: 'PAID' },
      _sum: { finalAmount: true }
    })

    const wasteLogs = await prisma.wasteLog.findMany({
      where: { createdAt: { gte: startDate } },
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

    // (Giá trị tồn kho thì không bị ảnh hưởng bởi thời gian, vì nó luôn là số thực tại của ngày hôm nay)
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}