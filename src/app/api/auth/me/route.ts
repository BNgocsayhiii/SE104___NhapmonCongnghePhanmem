import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const { payload } = await jwtVerify(token, SECRET)
    return NextResponse.json({ user: payload })
  } catch {
    return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 401 })
  }
}