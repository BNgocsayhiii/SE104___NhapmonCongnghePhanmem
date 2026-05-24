import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const getFruitIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('nho')) return '🍇'
  if (lowerName.includes('táo')) return '🍎'
  if (lowerName.includes('xoài')) return '🥭'
  if (lowerName.includes('dưa')) return '🍉'
  if (lowerName.includes('cam') || lowerName.includes('quýt')) return '🍊'
  if (lowerName.includes('chuối')) return '🍌'
  if (lowerName.includes('dâu')) return '🍓'
  return '📦'
}

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    const [
      revenueData,
      expiringSoon,
      lowStock,
      urgentBatchesRaw,
      pendingOnlineOrders,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { createdAt: { gte: today }, status: 'PAID' },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      prisma.batch.count({
        where: { expiredAt: { gte: today, lte: threeDaysLater }, status: { in: ['FRESH', 'NEAR_EXPIRY'] }, effectiveRemaining: { gt: 0 } },
      }),
      prisma.batch.count({
        where: { status: { in: ['FRESH', 'NEAR_EXPIRY'] }, effectiveRemaining: { gt: 0, lte: 20 } },
      }),
      prisma.batch.findMany({
        where: {
          effectiveRemaining: { gt: 0 },
          status: { in: ['FRESH', 'NEAR_EXPIRY', 'EXPIRED'] },
          OR: [{ expiredAt: { lte: threeDaysLater } }, { status: 'EXPIRED' }],
        },
        orderBy: [{ expiredAt: 'asc' }, { effectiveRemaining: 'desc' }],
        take: 8,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          importReceipt: { include: { supplier: { select: { name: true } } } },
        },
      }),
      prisma.invoice.findMany({
        where: { channel: 'ONLINE', status: { in: ['PENDING', 'PROCESSING', 'SHIPPING'] } },
        orderBy: { createdAt: 'asc' },
        take: 6,
        include: { customer: { select: { name: true } } },
      }),
    ])

    const invoiceItemsToday = await prisma.invoiceItem.findMany({
      where: { invoice: { createdAt: { gte: today }, status: 'PAID' } },
      select: { quantity: true, subtotal: true, batch: { select: { importPrice: true } } },
    })

    const totalRevenue = revenueData._sum.finalAmount ?? 0
    const totalCost = invoiceItemsToday.reduce((sum, item) => sum + item.quantity * item.batch.importPrice, 0)
    const totalProfit = totalRevenue - totalCost

    const w1Start = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)
    const w2Start = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)
    const w3Start = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
    const w4Start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const chartItems = await prisma.invoiceItem.findMany({
      where: { invoice: { status: 'PAID', createdAt: { gte: w1Start } } },
      select: { subtotal: true, quantity: true, invoice: { select: { createdAt: true } }, batch: { select: { importPrice: true } } },
    })

    let w1 = 0
    let w2 = 0
    let w3 = 0
    let w4 = 0
    chartItems.forEach(item => {
      const profit = item.subtotal - item.quantity * item.batch.importPrice
      const time = item.invoice.createdAt.getTime()
      if (time >= w4Start.getTime()) w4 += profit
      else if (time >= w3Start.getTime()) w3 += profit
      else if (time >= w2Start.getTime()) w2 += profit
      else w1 += profit
    })

    const chartData = [
      { label: 'Tuần 1', value: Math.max(0, w1) },
      { label: 'Tuần 2', value: Math.max(0, w2) },
      { label: 'Tuần 3', value: Math.max(0, w3) },
      { label: 'Tuần 4', value: Math.max(0, w4) },
    ]

    const topItems = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { invoice: { status: 'PAID' } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    })

    const products = await prisma.product.findMany({
      where: { id: { in: topItems.map(item => item.productId) } },
      include: { category: true },
    })

    const bestSellers = topItems.map(item => {
      const product = products.find(entry => entry.id === item.productId)
      return {
        id: item.productId,
        name: product?.name || 'Sản phẩm lỗi',
        cat: product?.category.name || 'Khác',
        sold: item._sum.quantity || 0,
        img: getFruitIcon(product?.name || ''),
      }
    })

    const activeBatches = await prisma.batch.findMany({
      where: { effectiveRemaining: { gt: 0 }, status: { in: ['FRESH', 'NEAR_EXPIRY'] } },
      include: { product: { select: { id: true, name: true, sku: true, unit: true } } },
    })

    const lowStockProducts = Object.values(activeBatches.reduce<Record<string, {
      productId: string
      name: string
      sku: string
      unit: string
      totalRemaining: number
      batchCount: number
    }>>((acc, batch) => {
      if (!acc[batch.productId]) {
        acc[batch.productId] = {
          productId: batch.productId,
          name: batch.product.name,
          sku: batch.product.sku,
          unit: batch.product.unit,
          totalRemaining: 0,
          batchCount: 0,
        }
      }
      acc[batch.productId].totalRemaining += batch.effectiveRemaining
      acc[batch.productId].batchCount += 1
      return acc
    }, {})).filter(product => product.totalRemaining <= 20).sort((a, b) => a.totalRemaining - b.totalRemaining).slice(0, 8)

    const urgentBatches = urgentBatchesRaw.map(batch => {
      const daysLeft = Math.ceil((batch.expiredAt.getTime() - Date.now()) / 86400000)
      return {
        id: batch.id,
        batchCode: batch.batchCode,
        productName: batch.product.name,
        sku: batch.product.sku,
        unit: batch.product.unit,
        effectiveRemaining: batch.effectiveRemaining,
        expiredAt: batch.expiredAt.toISOString(),
        daysLeft,
        status: daysLeft < 0 ? 'EXPIRED' : daysLeft <= 3 ? 'NEAR_EXPIRY' : batch.status,
        supplierName: batch.importReceipt.supplier.name,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        revenue: { label: 'Doanh thu hôm nay', value: totalRevenue, formatted: totalRevenue.toLocaleString('vi-VN') + ' đ', orderCount: revenueData._count.id },
        profit: { label: 'Lợi nhuận hôm nay', value: Math.round(totalProfit), formatted: Math.round(totalProfit).toLocaleString('vi-VN') + ' đ' },
        expiringSoon: { label: 'Lô cần xử lý', value: urgentBatches.length, formatted: `${urgentBatches.length} lô` },
        lowStock: { label: 'Sắp hết hàng', value: lowStockProducts.length || lowStock, formatted: `${lowStockProducts.length || lowStock} mặt hàng` },
        chartData,
        bestSellers,
        urgentBatches,
        lowStockProducts,
        pendingOnlineOrders: pendingOnlineOrders.map(invoice => ({
          id: invoice.id,
          invoiceCode: invoice.invoiceCode,
          finalAmount: invoice.finalAmount,
          status: invoice.status,
          createdAt: invoice.createdAt.toISOString(),
          customerName: invoice.customer?.name || 'Khách online',
        })),
      },
    })
  } catch (error) {
    console.error('[dashboard/stats] GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
