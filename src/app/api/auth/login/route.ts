import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' }, { status: 401 })
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Tài khoản đã bị vô hiệu hóa' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' }, { status: 401 })
    }

    // Tạo JWT token
    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
    })

    response.cookies.set('token', token, {  
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 giờ
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}