import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const items = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    where: { invoice: { createdAt: { gte: weekStart }, status: { in: ['PAID', 'DELIVERED'] } } },
    _sum: { subtotal: true, quantity: true },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: 5,
  })

  const productIds = items.map(i => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unit: true },
  })

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const max = items[0]?._sum.subtotal ?? 1

  const result = items.map((item, idx) => ({
    rank: idx + 1,
    name: productMap[item.productId]?.name ?? 'Unknown',
    unit: productMap[item.productId]?.unit ?? '',
    revenue: Math.round(item._sum.subtotal ?? 0),
    quantity: Math.round(item._sum.quantity ?? 0),
    pct: Math.round(((item._sum.subtotal ?? 0) / max) * 100),
  }))

  return NextResponse.json(result)
}