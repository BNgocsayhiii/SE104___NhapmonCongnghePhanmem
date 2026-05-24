import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { apiError, apiMessage, requireSession, writeAuditLog } from '@/lib/api'
import { formatZodError, userCreateSchema, userStatusSchema, userUpdateSchema } from '@/lib/validations'

const userSelect = {
  id: true,
  username: true,
  fullName: true,
  phone: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
}

export async function GET(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req)
    if (response) return response

    const users = session.role === 'MANAGER'
      ? await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'desc' } })
      : await prisma.user.findMany({ where: { id: session.id }, select: userSelect })

    return NextResponse.json({ success: true, data: users, currentRole: session.role, currentUserId: session.id })
  } catch (error) {
    console.error('[GET /api/nhan-vien/danh-sach] Error:', error)
    return apiError('Lỗi server')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const body = await req.json()
    const parsed = userCreateSchema.safeParse(body)
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const { username, fullName, phone, email, role, password } = parsed.data
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) return apiError('Tên đăng nhập đã tồn tại!', { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword, fullName, phone, email, role, status: 'ACTIVE' },
      select: userSelect,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'CREATE_USER',
      target: 'User',
      targetId: newUser.id,
      newValue: newUser,
    })

    return apiMessage('Tạo tài khoản thành công!', newUser, { status: 201 })
  } catch (error) {
    console.error('[POST /api/nhan-vien/danh-sach] Error:', error)
    return apiError('Lỗi server')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req)
    if (response) return response

    const parsed = userUpdateSchema.safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })
    const { id, fullName, phone, email, password, role } = parsed.data

    if (session.role !== 'MANAGER' && id !== session.id) {
      return apiError('Không có quyền chỉnh sửa', { status: 403 })
    }

    const oldUser = await prisma.user.findUnique({ where: { id }, select: userSelect })
    if (!oldUser) return apiError('Tài khoản không tồn tại', { status: 404 })

    const updateData: {
      fullName: string
      phone?: string
      email?: string
      password?: string
      role?: 'MANAGER' | 'STAFF_SALES' | 'STAFF_WAREHOUSE'
    } = { fullName, phone, email }

    if (password && id === session.id) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    if (session.role === 'MANAGER' && role && id !== session.id) {
      updateData.role = role
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'UPDATE_USER',
      target: 'User',
      targetId: updated.id,
      oldValue: oldUser,
      newValue: updated,
    })

    return apiMessage('Cập nhật thành công!', updated)
  } catch (error) {
    console.error('[PUT /api/nhan-vien/danh-sach] Error:', error)
    return apiError('Lỗi server')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const parsed = userStatusSchema.safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })
    const { id, status } = parsed.data

    if (id === session.id && status === 'INACTIVE') {
      return apiError('Người quản lý không được tự vô hiệu hóa tài khoản của chính mình', { status: 400 })
    }

    const oldUser = await prisma.user.findUnique({ where: { id }, select: userSelect })
    if (!oldUser) return apiError('Tài khoản không tồn tại', { status: 404 })

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: userSelect,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: status === 'ACTIVE' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      target: 'User',
      targetId: updated.id,
      oldValue: oldUser,
      newValue: updated,
    })

    return apiMessage(`Đã ${status === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`, updated)
  } catch (error) {
    console.error('[PATCH /api/nhan-vien/danh-sach] Error:', error)
    return apiError('Lỗi server')
  }
}
