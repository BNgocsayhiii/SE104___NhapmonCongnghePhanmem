import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Lấy toàn bộ danh sách khách hàng từ database, sắp xếp người mới nhất lên đầu
    const customers = await prisma.customer.findMany({
      orderBy: {
        id: 'desc'
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error)
    return NextResponse.json({ error: 'Không thể lấy dữ liệu khách hàng' }, { status: 500 })
  }
}