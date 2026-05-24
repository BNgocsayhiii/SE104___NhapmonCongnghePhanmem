import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')

export async function GET(req: NextRequest) {
  try {
    // 1. KIỂM TRA QUYỀN (Đọc token từ cookie)
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { payload } = await jwtVerify(token, SECRET)
    const userId = payload.id as string
    const userRole = payload.role as string

    if (userRole === 'STAFF_WAREHOUSE') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 2. LẤY THAM SỐ TÌM KIẾM & BỘ LỌC
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const filterDate = searchParams.get('date') // Format: YYYY-MM-DD
    const filterMonth = searchParams.get('month') // Format: YYYY-MM

    // 3. XÂY DỰNG ĐIỀU KIỆN TRUY VẤN (WHERE CLAUSE)
    let whereClause: any = {}

    // Tìm kiếm theo Mã HĐ hoặc SĐT/Tên khách hàng
    if (search) {
      whereClause.OR = [
        { invoiceCode: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ]
    }

    // PHÂN QUYỀN LẤY DỮ LIỆU
    if (userRole === 'STAFF_SALES') {
      // Nhân viên: Bắt buộc chỉ xem của mình và ngày hôm nay
      whereClause.createdById = userId
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      whereClause.createdAt = { gte: today }
    } else if (userRole === 'MANAGER') {
      // Quản lý: Lọc theo ngày hoặc tháng được chọn (Mặc định là hôm nay)
      if (filterDate) {
        const start = new Date(filterDate)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        whereClause.createdAt = { gte: start, lt: end }
      } else if (filterMonth) {
        const [year, month] = filterMonth.split('-')
        const start = new Date(parseInt(year), parseInt(month) - 1, 1)
        const end = new Date(parseInt(year), parseInt(month), 1)
        whereClause.createdAt = { gte: start, lt: end }
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        whereClause.createdAt = { gte: today }
      }
    }

    // 4. CHẠY TRUY VẤN
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true, phone: true } },
        createdBy: { select: { fullName: true } },
        items: {
          include: { product: { select: { name: true, unit: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    console.error('[GET /api/ban-hang/lich-su] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}