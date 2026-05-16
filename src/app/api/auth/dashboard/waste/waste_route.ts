import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [byReason, byProduct, totalImport] = await Promise.all([
    // Hao hụt theo lý do
    prisma.wasteLog.groupBy({
      by: ['reason'],
      where: { createdAt: { gte: weekStart } },
      _sum: { quantity: true },
    }),
    // Hao hụt theo sản phẩm (top 5)
    prisma.wasteLog.groupBy({
      by: ['batchId'],
      where: { createdAt: { gte: weekStart } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    // Tổng nhập tuần để tính %
    prisma.batch.aggregate({
      where: { createdAt: { gte: weekStart } },
      _sum: { quantity: true },
    }),
  ])

  // Lấy tên sản phẩm từ batch
  const batchIds = byProduct.map(b => b.batchId)
  const batches = await prisma.batch.findMany({
    where: { id: { in: batchIds } },
    include: { product: { select: { name: true } } },
  })
  const batchMap = Object.fromEntries(batches.map(b => [b.id, b]))

  const totalWaste = byReason.reduce((s, r) => s + (r._sum.quantity ?? 0), 0)
  const totalImportQty = totalImport._sum.quantity ?? 1

  // Giá trị thiệt hại: estimate từ importPrice của batch
  const wasteWithValue = await Promise.all(
    byProduct.map(async item => {
      const batch = batchMap[item.batchId]
      const qty = item._sum.quantity ?? 0
      const damage = Math.round(qty * (batch?.importPrice ?? 0))
      return {
        name: batch?.product?.name ?? 'Unknown',
        quantity: Math.round(qty * 10) / 10,
        damage,
      }
    })
  )

  const reasonLabels: Record<string, string> = {
    EXPIRED: 'Hết hạn',
    DAMAGED: 'Hỏng/dập',
    BIOLOGICAL: 'Sinh học',
    OTHER: 'Khác',
  }

  return NextResponse.json({
    byReason: byReason.map(r => ({
      reason: reasonLabels[r.reason] ?? r.reason,
      quantity: Math.round((r._sum.quantity ?? 0) * 10) / 10,
      pct: Math.round(((r._sum.quantity ?? 0) / Math.max(totalWaste, 1)) * 100),
    })),
    byProduct: wasteWithValue,
    totalWaste: Math.round(totalWaste * 10) / 10,
    totalDamage: wasteWithValue.reduce((s, w) => s + w.damage, 0),
    wastePct: Math.round((totalWaste / totalImportQty) * 100 * 10) / 10,
  })
}