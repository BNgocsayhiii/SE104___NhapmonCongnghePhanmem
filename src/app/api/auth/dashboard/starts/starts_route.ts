import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [revenueToday, invoiceToday, nearExpiry, totalStock] = await Promise.all([
    // Doanh thu hôm nay
    prisma.invoice.aggregate({
      where: { createdAt: { gte: todayStart }, status: { in: ['PAID', 'DELIVERED'] } },
      _sum: { finalAmount: true },
    }),
    // Số hóa đơn hôm nay
    prisma.invoice.count({
      where: { createdAt: { gte: todayStart }, status: { in: ['PAID', 'DELIVERED'] } },
    }),
    // Lô sắp hết hạn (còn <= 2 ngày)
    prisma.batch.count({
      where: { status: 'NEAR_EXPIRY', remaining: { gt: 0 } },
    }),
    // Tổng tồn kho (kg)
    prisma.batch.aggregate({
      where: { status: { in: ['FRESH', 'NEAR_EXPIRY'] } },
      _sum: { remaining: true },
    }),
  ])

  // So sánh với hôm qua
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayEnd = new Date(todayStart)

  const revenueYesterday = await prisma.invoice.aggregate({
    where: {
      createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      status: { in: ['PAID', 'DELIVERED'] },
    },
    _sum: { finalAmount: true },
  })

  const todayRev = revenueToday._sum.finalAmount ?? 0
  const yestRev = revenueYesterday._sum.finalAmount ?? 0
  const revChange = yestRev > 0 ? Math.round(((todayRev - yestRev) / yestRev) * 100) : 0

  return NextResponse.json({
    revenueToday: todayRev,
    revChange,
    invoiceToday,
    nearExpiry,
    totalStock: Math.round(totalStock._sum.remaining ?? 0),
  })
}