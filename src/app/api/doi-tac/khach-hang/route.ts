import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        invoices: {
          where: { status: 'PAID' },
          select: { finalAmount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const data = customers.map(c => ({
      id: c.id,
      code: `KH${c.id.slice(-5).toUpperCase()}`, // Tạo mã KH ngắn từ ID
      name: c.name,
      phone: c.phone,
      email: c.email || '-',
      address: c.address || 'Chưa cập nhật',
      points: c.points,
      createdAt: c.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
      totalSpent: c.invoices.reduce((sum, inv) => sum + inv.finalAmount, 0)
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[GET /api/customers] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}