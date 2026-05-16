import { NextRequest, NextResponse } from 'next/server'
export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Vào route cần auth mà chưa có token → về login
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*'],
}