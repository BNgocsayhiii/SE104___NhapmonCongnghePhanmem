import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period') ?? 'ngay'

  const now = new Date()
  const results: { label: string; pos: number; online: number }[] = []

  if (period === 'ngay') {
    // 7 ngày gần nhất
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const dEnd = new Date(d)
      dEnd.setHours(23, 59, 59, 999)

      const [pos, online] = await Promise.all([
        prisma.invoice.aggregate({
          where: { createdAt: { gte: d, lte: dEnd }, channel: 'POS', status: { in: ['PAID', 'DELIVERED'] } },
          _sum: { finalAmount: true },
        }),
        prisma.invoice.aggregate({
          where: { createdAt: { gte: d, lte: dEnd }, channel: 'ONLINE', status: { in: ['PAID', 'DELIVERED'] } },
          _sum: { finalAmount: true },
        }),
      ])

      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      results.push({
        label: days[d.getDay()],
        pos: Math.round(pos._sum.finalAmount ?? 0),
        online: Math.round(online._sum.finalAmount ?? 0),
      })
    }
  } else if (period === 'tuan') {
    // 4 tuần gần nhất
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const [pos, online] = await Promise.all([
        prisma.invoice.aggregate({
          where: { createdAt: { gte: weekStart, lte: weekEnd }, channel: 'POS', status: { in: ['PAID', 'DELIVERED'] } },
          _sum: { finalAmount: true },
        }),
        prisma.invoice.aggregate({
          where: { createdAt: { gte: weekStart, lte: weekEnd }, channel: 'ONLINE', status: { in: ['PAID', 'DELIVERED'] } },
          _sum: { finalAmount: true },
        }),
      ])

      results.push({
        label: `Tuần ${4 - i}`,
        pos: Math.round(pos._sum.finalAmount ?? 0),
        online: Math.round(online._sum.finalAmount ?? 0),
      })
    }
  } else {
    // 6 tháng gần nhất
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const [pos, online] = await Promise.all([
        prisma.invoice.aggregate({
          where: { createdAt: { gte: d, lte: dEnd }, channel: 'POS', status: { in: ['PAID', 'DELIVERED'] } },
          _sum: { finalAmount: true },
        }),
        prisma.invoice.aggregate({
          where: { createdAt: { gte: d, lte: dEnd }, channel: 'ONLINE', status: { in: ['PAID', 'DELIVERED'] } },
          _sum: { finalAmount: true },
        }),
      ])

      results.push({
        label: `T${d.getMonth() + 1}`,
        pos: Math.round(pos._sum.finalAmount ?? 0),
        online: Math.round(online._sum.finalAmount ?? 0),
      })
    }
  }

  return NextResponse.json(results)
}