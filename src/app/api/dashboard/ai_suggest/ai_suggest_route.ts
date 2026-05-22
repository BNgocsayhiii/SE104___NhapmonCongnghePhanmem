import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Lấy doanh số 30 ngày
  const salesData = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    where: { invoice: { createdAt: { gte: thirtyDaysAgo }, status: { in: ['PAID', 'DELIVERED'] } } },
    _sum: { quantity: true },
  })

  // Tồn kho hiện tại
  const stockData = await prisma.batch.groupBy({
    by: ['productId'],
    where: { status: { in: ['FRESH', 'NEAR_EXPIRY'] } },
    _sum: { remaining: true },
  })

  // Hao hụt 30 ngày
  const wasteData = await prisma.wasteLog.groupBy({
    by: ['batchId'],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _sum: { quantity: true },
  })

  const batches = await prisma.batch.findMany({
    where: { id: { in: wasteData.map(w => w.batchId) } },
    select: { id: true, productId: true, quantity: true },
  })

  // wastePct theo productId
  const wasteByProduct: Record<string, number> = {}
  for (const w of wasteData) {
    const batch = batches.find(b => b.id === w.batchId)
    if (!batch) continue
    wasteByProduct[batch.productId] =
      (wasteByProduct[batch.productId] ?? 0) + (w._sum.quantity ?? 0)
  }

  const productIds = [...new Set(salesData.map(s => s.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'ACTIVE' },
    select: { id: true, name: true, unit: true, evaporationRate: true, shelfLifeDays: true },
  })

  const stockMap = Object.fromEntries(stockData.map(s => [s.productId, s._sum.remaining ?? 0]))
  const salesMap = Object.fromEntries(salesData.map(s => [s.productId, s._sum.quantity ?? 0]))

  const suggestions = products
    .map(p => {
      const totalSold = salesMap[p.id] ?? 0
      const avgPerDay = totalSold / 30
      const stock = stockMap[p.id] ?? 0
      const totalImport = batches
        .filter(b => b.productId === p.id)
        .reduce((s, b) => s + b.quantity, 0)
      const wastePct = totalImport > 0
        ? Math.round(((wasteByProduct[p.id] ?? 0) / totalImport) * 100)
        : p.evaporationRate * 100

      // Dự kiến hết hàng sau bao nhiêu ngày
      const daysLeft = avgPerDay > 0 ? Math.floor(stock / avgPerDay) : 99

      // Gợi ý nhập cho 3 ngày tới (có tính hao hụt)
      const needed = Math.ceil(avgPerDay * 3 * (1 + wastePct / 100))
      const shouldImport = daysLeft <= 3 || needed > stock

      if (!shouldImport) return null

      let reason = ''
      if (daysLeft <= 1) reason = `Tồn kho gần hết, chỉ còn ~${daysLeft} ngày bán`
      else if (daysLeft <= 3) reason = `Bán ${avgPerDay.toFixed(1)}${p.unit}/ngày, còn ${Math.round(stock)}${p.unit}`
      else reason = `Xu hướng tăng, hao hụt ${wastePct}%`

      return {
        name: p.name,
        unit: p.unit,
        suggestQty: needed,
        wastePct,
        daysLeft,
        reason,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a!.daysLeft - b!.daysLeft))
    .slice(0, 5)

  return NextResponse.json(suggestions)
}