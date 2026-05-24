import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { apiError, apiMessage, apiSuccess, requireSession, writeAuditLog } from '@/lib/api'
import { customerSchema, formatZodError } from '@/lib/validations'

const customerSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  points: true,
  createdAt: true,
}

type CustomerForList = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  points: number
  createdAt: Date
  invoices?: { finalAmount: number }[]
}

function mapCustomer(c: CustomerForList) {
  return {
    id: c.id,
    code: `KH${c.id.slice(-5).toUpperCase()}`,
    name: c.name,
    phone: c.phone,
    email: c.email || '-',
    address: c.address || 'Chưa cập nhật',
    points: c.points,
    createdAt: c.createdAt.toISOString().split('T')[0],
    totalSpent: c.invoices?.reduce((sum, inv) => sum + inv.finalAmount, 0) ?? 0,
  }
}

function uniqueError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return apiError('Số điện thoại hoặc email khách hàng đã tồn tại', { status: 400 })
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSession(req, ['MANAGER', 'STAFF_SALES'])
    if (response) return response

    const customers = await prisma.customer.findMany({
      include: {
        invoices: {
          where: { status: 'PAID' },
          select: { finalAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(customers.map(mapCustomer))
  } catch (error) {
    console.error('[GET /api/doi-tac/khach-hang] Error:', error)
    return apiError('Không tải được dữ liệu khách hàng')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_SALES'])
    if (response) return response

    const parsed = customerSchema.omit({ id: true }).safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const customer = await prisma.customer.create({
      data: parsed.data,
      select: customerSelect,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'CREATE_CUSTOMER',
      target: 'Customer',
      targetId: customer.id,
      newValue: customer,
    })

    return apiMessage('Tạo khách hàng thành công', mapCustomer(customer), { status: 201 })
  } catch (error) {
    const response = uniqueError(error)
    if (response) return response
    console.error('[POST /api/doi-tac/khach-hang] Error:', error)
    return apiError('Không tạo được khách hàng')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_SALES'])
    if (response) return response

    const parsed = customerSchema.required({ id: true }).safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const oldCustomer = await prisma.customer.findUnique({ where: { id: parsed.data.id }, select: customerSelect })
    if (!oldCustomer) return apiError('Khách hàng không tồn tại', { status: 404 })

    const customer = await prisma.customer.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        address: parsed.data.address,
      },
      select: customerSelect,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'UPDATE_CUSTOMER',
      target: 'Customer',
      targetId: customer.id,
      oldValue: oldCustomer,
      newValue: customer,
    })

    return apiMessage('Cập nhật khách hàng thành công', mapCustomer(customer))
  } catch (error) {
    const response = uniqueError(error)
    if (response) return response
    console.error('[PUT /api/doi-tac/khach-hang] Error:', error)
    return apiError('Không cập nhật được khách hàng')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return apiError('Thiếu khách hàng cần xóa', { status: 400 })

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { ...customerSelect, _count: { select: { invoices: true } } },
    })
    if (!customer) return apiError('Khách hàng không tồn tại', { status: 404 })
    if (customer._count.invoices > 0) {
      return apiError('Không được xóa khách hàng đã phát sinh hóa đơn', { status: 400 })
    }

    await prisma.customer.delete({ where: { id } })
    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'DELETE_CUSTOMER',
      target: 'Customer',
      targetId: id,
      oldValue: customer,
    })

    return apiMessage('Xóa khách hàng thành công')
  } catch (error) {
    console.error('[DELETE /api/doi-tac/khach-hang] Error:', error)
    return apiError('Không xóa được khách hàng')
  }
}
