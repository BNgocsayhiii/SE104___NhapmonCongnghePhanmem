import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { apiError, apiMessage, apiSuccess, requireSession, writeAuditLog } from '@/lib/api'
import { formatZodError, supplierSchema } from '@/lib/validations'

const supplierSelect = {
  id: true,
  name: true,
  contactName: true,
  phone: true,
  email: true,
  address: true,
  createdAt: true,
}

function mapSupplier(s: Awaited<ReturnType<typeof prisma.supplier.findMany>>[number]) {
  return {
    id: s.id,
    code: `NCC${s.id.slice(-4).toUpperCase()}`,
    name: s.name,
    contactName: s.contactName || 'Chưa cập nhật',
    phone: s.phone,
    email: s.email || '-',
    address: s.address || 'Chưa cập nhật',
    createdAt: s.createdAt.toISOString().split('T')[0],
  }
}

function uniqueError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return apiError('Số điện thoại hoặc email nhà cung cấp đã tồn tại', { status: 400 })
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(suppliers.map(mapSupplier))
  } catch (error) {
    console.error('[GET /api/doi-tac/nha-cung-cap] Error:', error)
    return apiError('Không tải được dữ liệu nhà cung cấp')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    const parsed = supplierSchema.omit({ id: true }).safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const supplier = await prisma.supplier.create({
      data: parsed.data,
      select: supplierSelect,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'CREATE_SUPPLIER',
      target: 'Supplier',
      targetId: supplier.id,
      newValue: supplier,
    })

    return apiMessage('Tạo nhà cung cấp thành công', mapSupplier(supplier), { status: 201 })
  } catch (error) {
    const response = uniqueError(error)
    if (response) return response
    console.error('[POST /api/doi-tac/nha-cung-cap] Error:', error)
    return apiError('Không tạo được nhà cung cấp')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    const parsed = supplierSchema.required({ id: true }).safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const oldSupplier = await prisma.supplier.findUnique({ where: { id: parsed.data.id }, select: supplierSelect })
    if (!oldSupplier) return apiError('Nhà cung cấp không tồn tại', { status: 404 })

    const supplier = await prisma.supplier.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        contactName: parsed.data.contactName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        address: parsed.data.address,
      },
      select: supplierSelect,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'UPDATE_SUPPLIER',
      target: 'Supplier',
      targetId: supplier.id,
      oldValue: oldSupplier,
      newValue: supplier,
    })

    return apiMessage('Cập nhật nhà cung cấp thành công', mapSupplier(supplier))
  } catch (error) {
    const response = uniqueError(error)
    if (response) return response
    console.error('[PUT /api/doi-tac/nha-cung-cap] Error:', error)
    return apiError('Không cập nhật được nhà cung cấp')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return apiError('Thiếu nhà cung cấp cần xóa', { status: 400 })

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: { ...supplierSelect, _count: { select: { importReceipts: true } } },
    })
    if (!supplier) return apiError('Nhà cung cấp không tồn tại', { status: 404 })
    if (supplier._count.importReceipts > 0) {
      return apiError('Không được xóa nhà cung cấp đã phát sinh phiếu nhập', { status: 400 })
    }

    await prisma.supplier.delete({ where: { id } })
    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'DELETE_SUPPLIER',
      target: 'Supplier',
      targetId: id,
      oldValue: supplier,
    })

    return apiMessage('Xóa nhà cung cấp thành công')
  } catch (error) {
    console.error('[DELETE /api/doi-tac/nha-cung-cap] Error:', error)
    return apiError('Không xóa được nhà cung cấp')
  }
}
