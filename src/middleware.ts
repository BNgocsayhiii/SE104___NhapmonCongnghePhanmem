import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')

const PUBLIC_ROUTES = ['/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (token) {
      try {
        await jwtVerify(token, SECRET)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } catch {}
    }
    return NextResponse.next()
  }

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}