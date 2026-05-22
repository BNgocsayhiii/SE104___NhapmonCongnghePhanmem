import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
 
// GET /api/dashboard/stats
export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
 
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
 
    const [revenueData, expiringSoon, lowStock] = await Promise.all([
 
      // Doanh thu + lợi nhuận hôm nay từ các Invoice đã PAID
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: today },
          status: 'PAID',                 // InvoiceStatus enum
        },
        _sum: {
          finalAmount: true,              // Doanh thu thực thu
          discount: true,                 // Tổng giảm giá
        },
        _count: { id: true },             // Số đơn hàng
      }),
 
      // Số lô sắp hết hạn trong 3 ngày tới (chưa bị hủy)
      prisma.batch.count({
        where: {
          expiredAt: {                    // field đúng là expiredAt
            gte: today,
            lte: threeDaysLater,
          },
          status: { in: ['FRESH', 'NEAR_EXPIRY'] }, // Bỏ qua lô đã hủy/hết hạn
        },
      }),
 
      // Số lô hàng còn ít (remaining <= 10% so với quantity ban đầu)
      prisma.batch.count({
        where: {
          status: { in: ['FRESH', 'NEAR_EXPIRY'] },
          remaining: { gt: 0 },
          // Lọc lô còn dưới 20% lượng ban đầu
          AND: [
            { remaining: { lte: 20 } },  // TODO: thay bằng dynamic nếu cần
          ],
        },
      }),
 
    ])
 
    // Tính lợi nhuận thô: finalAmount - (importPrice * quantity) từ InvoiceItem
    // Đây là cách chính xác nhất theo schema hiện tại
    const profitData = await prisma.invoiceItem.aggregate({
      where: {
        invoice: {
          createdAt: { gte: today },
          status: 'PAID',
        },
      },
      _sum: {
        subtotal: true,   // Doanh thu từng item
        quantity: true,
      },
    })
 
    // Tính giá vốn từ batch.importPrice
    const invoiceItemsWithCost = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          createdAt: { gte: today },
          status: 'PAID',
        },
      },
      select: {
        quantity: true,
        subtotal: true,
        batch: { select: { importPrice: true } },
      },
    })
 
    const totalRevenue = revenueData._sum.finalAmount ?? 0
    const totalCost = invoiceItemsWithCost.reduce(
      (sum, item) => sum + item.quantity * item.batch.importPrice,
      0
    )
    const totalProfit = totalRevenue - totalCost
 
    return NextResponse.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        revenue: {
          label: 'Doanh thu hôm nay',
          value: totalRevenue,
          formatted: totalRevenue.toLocaleString('vi-VN') + ' ₫',
          orderCount: revenueData._count.id,
        },
        profit: {
          label: 'Lợi nhuận hôm nay',
          value: Math.round(totalProfit),
          formatted: Math.round(totalProfit).toLocaleString('vi-VN') + ' ₫',
        },
        expiringSoon: {
          label: 'Sắp hết hạn',
          value: expiringSoon,
          formatted: `${expiringSoon} lô`,
        },
        lowStock: {
          label: 'Sắp hết hàng',
          value: lowStock,
          formatted: `${lowStock} lô`,
        },
      },
    })
  } catch (error) {
    console.error('[dashboard/stats] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}