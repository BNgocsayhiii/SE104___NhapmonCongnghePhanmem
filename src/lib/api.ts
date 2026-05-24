import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')

export type AppRole = 'MANAGER' | 'STAFF_SALES' | 'STAFF_WAREHOUSE'

export type SessionUser = {
  id: string
  username?: string
  fullName?: string
  role: AppRole
}

type ApiErrorOptions = {
  status?: number
  details?: unknown
}

type AuditClient = {
  auditLog: {
    create: typeof prisma.auditLog.create
  }
}

export function apiSuccess<T>(data?: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

export function apiMessage(message: string, data?: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, message, data }, init)
}

export function apiError(message: string, options: ApiErrorOptions = {}) {
  const { status = 500, details } = options
  return NextResponse.json({ success: false, error: message, message, details }, { status })
}

export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get('token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const role = payload.role
    if (role !== 'MANAGER' && role !== 'STAFF_SALES' && role !== 'STAFF_WAREHOUSE') return null
    if (typeof payload.id !== 'string') return null

    return {
      id: payload.id,
      username: typeof payload.username === 'string' ? payload.username : undefined,
      fullName: typeof payload.fullName === 'string' ? payload.fullName : undefined,
      role,
    }
  } catch {
    return null
  }
}

export async function requireSession(req: NextRequest, allowedRoles?: AppRole[]) {
  const session = await getSession(req)
  if (!session) return { session: null, response: apiError('Chưa đăng nhập', { status: 401 }) }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { session: null, response: apiError('Bạn không có quyền thực hiện thao tác này', { status: 403 }) }
  }

  return { session, response: null }
}

export function serializeAuditValue(value: unknown) {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export async function writeAuditLog(
  db: AuditClient,
  input: {
    userId: string
    action: string
    target: string
    targetId: string
    oldValue?: unknown
    newValue?: unknown
  },
) {
  await db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      target: input.target,
      targetId: input.targetId,
      oldValue: serializeAuditValue(input.oldValue),
      newValue: serializeAuditValue(input.newValue),
    },
  })
}
