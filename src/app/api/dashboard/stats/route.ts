import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function để gán icon trái cây (vì DB không lưu icon)
const getFruitIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('nho')) return '🍇';
  if (lowerName.includes('sầu riêng')) return '🍈';
  if (lowerName.includes('táo')) return '🍎';
  if (lowerName.includes('bưởi') || lowerName.includes('lê')) return '🍐';
  if (lowerName.includes('xoài')) return '🥭';
  if (lowerName.includes('dưa')) return '🍉';
  if (lowerName.includes('cam') || lowerName.includes('quýt')) return '🍊';
  if (lowerName.includes('chuối')) return '🍌';
  if (lowerName.includes('dâu')) return '🍓';
  return '📦'; // Default icon
}

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    // --- 1. TÍNH 4 CHỈ SỐ TỔNG QUAN ---
    const [revenueData, expiringSoon, lowStock] = await Promise.all([
      prisma.invoice.aggregate({
        where: { createdAt: { gte: today }, status: 'PAID' },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      prisma.batch.count({
        where: { expiredAt: { gte: today, lte: threeDaysLater }, status: { in: ['FRESH', 'NEAR_EXPIRY'] } },
      }),
      prisma.batch.count({
        where: { status: { in: ['FRESH', 'NEAR_EXPIRY'] }, remaining: { gt: 0, lte: 20 } },
      }),
    ])

    const invoiceItemsToday = await prisma.invoiceItem.findMany({
      where: { invoice: { createdAt: { gte: today }, status: 'PAID' } },
      select: { quantity: true, subtotal: true, batch: { select: { importPrice: true } } },
    })

    const totalRevenue = revenueData._sum.finalAmount ?? 0
    const totalCost = invoiceItemsToday.reduce((sum, item) => sum + item.quantity * item.batch.importPrice, 0)
    const totalProfit = totalRevenue - totalCost

    // --- 2. TÍNH DATA BIỂU ĐỒ (LỢI NHUẬN 4 TUẦN GẦN NHẤT) ---
    const w1Start = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
    const w2Start = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000);
    const w3Start = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const w4Start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const chartItems = await prisma.invoiceItem.findMany({
      where: { invoice: { status: 'PAID', createdAt: { gte: w1Start } } },
      select: { subtotal: true, quantity: true, invoice: { select: { createdAt: true } }, batch: { select: { importPrice: true } } }
    });

    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    chartItems.forEach(item => {
      const profit = item.subtotal - (item.quantity * item.batch.importPrice);
      const time = item.invoice.createdAt.getTime();
      if (time >= w4Start.getTime()) w4 += profit;
      else if (time >= w3Start.getTime()) w3 += profit;
      else if (time >= w2Start.getTime()) w2 += profit;
      else w1 += profit;
    });

    const chartData = [
      { label: 'Tuần 1', value: Math.max(0, w1) }, // Math.max(0) để tránh số âm kéo lố biểu đồ
      { label: 'Tuần 2', value: Math.max(0, w2) },
      { label: 'Tuần 3', value: Math.max(0, w3) },
      { label: 'Tuần 4', value: Math.max(0, w4) }
    ];

    // --- 3. TÍNH BEST SELLER ---
    const topItems = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { invoice: { status: 'PAID' } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const productIds = topItems.map(t => t.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true }
    });

    const bestSellers = topItems.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return {
        id: item.productId,
        name: p?.name || 'Sản phẩm lỗi',
        cat: p?.category.name || 'Khác',
        sold: item._sum.quantity || 0,
        img: getFruitIcon(p?.name || '')
      }
    });

    // --- TRẢ VỀ ---
    return NextResponse.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        revenue: { label: 'Doanh thu hôm nay', value: totalRevenue, formatted: totalRevenue.toLocaleString('vi-VN') + ' ₫' },
        profit: { label: 'Lợi nhuận hôm nay', value: Math.round(totalProfit), formatted: Math.round(totalProfit).toLocaleString('vi-VN') + ' ₫' },
        expiringSoon: { label: 'Sắp hết hạn', value: expiringSoon, formatted: `${expiringSoon} lô` },
        lowStock: { label: 'Sắp hết hàng', value: lowStock, formatted: `${lowStock} lô` },
        chartData,
        bestSellers
      },
    })
  } catch (error) {
    console.error('[dashboard/stats] GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}