import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { WasteReason } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')

async function getSession(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null

  const { payload } = await jwtVerify(token, SECRET)
  return {
    id: payload.id as string,
    role: payload.role as string,
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    if (session.role === 'STAFF_SALES') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền hủy hàng' }, { status: 403 })
    }

    const [batches, wasteLogs] = await Promise.all([
      prisma.batch.findMany({
        where: { effectiveRemaining: { gt: 0 }, status: { in: ['FRESH', 'NEAR_EXPIRY', 'EXPIRED'] } },
        orderBy: [{ expiredAt: 'asc' }, { createdAt: 'asc' }],
        include: {
          product: { select: { name: true, unit: true } },
          importReceipt: { include: { supplier: { select: { name: true } } } },
        },
      }),
      prisma.wasteLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          batch: { include: { product: { select: { name: true, unit: true } } } },
          createdBy: { select: { fullName: true } },
        },
      }),
    ])

    const today = new Date()
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const [todayWaste, monthWaste] = await Promise.all([
      prisma.wasteLog.aggregate({ where: { createdAt: { gte: start } }, _sum: { quantity: true }, _count: { id: true } }),
      prisma.wasteLog.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { quantity: true }, _count: { id: true } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        batches: batches.map(batch => ({
          id: batch.id,
          batchCode: batch.batchCode,
          productName: batch.product.name,
          unit: batch.product.unit,
          supplierName: batch.importReceipt.supplier.name,
          remaining: batch.remaining,
          effectiveRemaining: batch.effectiveRemaining,
          importPrice: batch.importPrice,
          expiredAt: batch.expiredAt.toISOString(),
          status: batch.status,
        })),
        wasteLogs: wasteLogs.map(log => ({
          id: log.id,
          batchCode: log.batch.batchCode,
          productName: log.batch.product.name,
          unit: log.batch.product.unit,
          quantity: log.quantity,
          reason: log.reason,
          note: log.note,
          createdByName: log.createdBy.fullName,
          createdAt: log.createdAt.toISOString(),
          cost: log.quantity * log.batch.importPrice,
        })),
        summary: {
          todayCount: todayWaste._count.id,
          todayQuantity: todayWaste._sum.quantity ?? 0,
          monthCount: monthWaste._count.id,
          monthQuantity: monthWaste._sum.quantity ?? 0,
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/kho-hang/huy-hang] Error:', error)
    return NextResponse.json({ success: false, error: 'Không tải được dữ liệu hủy hàng' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    if (session.role === 'STAFF_SALES') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền hủy hàng' }, { status: 403 })
    }

    const body = await req.json()
    const batchId = String(body.batchId || '')
    const quantity = Number(body.quantity || 0)
    const reason = String(body.reason || '') as WasteReason
    const note = String(body.note || '').trim()

    if (!batchId || quantity <= 0 || !Object.values(WasteReason).includes(reason)) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin hợp lệ' }, { status: 400 })
    }
    if (reason === 'OTHER' && !note) {
      return NextResponse.json({ success: false, error: 'Vui lòng ghi rõ lý do khác' }, { status: 400 })
    }

    const wasteLog = await prisma.$transaction(async tx => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        select: { id: true, remaining: true, effectiveRemaining: true },
      })
      if (!batch) throw new Error('Lô hàng không tồn tại')
      if (quantity > batch.effectiveRemaining) throw new Error('Số lượng hủy vượt quá tồn thực tế')

      const nextRemaining = Math.max(batch.remaining - quantity, 0)
      const nextEffective = Math.max(batch.effectiveRemaining - quantity, 0)

      await tx.batch.update({
        where: { id: batchId },
        data: {
          remaining: nextRemaining,
          effectiveRemaining: nextEffective,
          ...(nextEffective === 0 ? { status: 'DISPOSED' } : {}),
        },
      })

      return tx.wasteLog.create({
        data: {
          batchId,
          quantity,
          reason,
          note: note || undefined,
          createdById: session.id,
        },
        include: {
          batch: { include: { product: { select: { name: true, unit: true } } } },
          createdBy: { select: { fullName: true } },
        },
      })
    })

    return NextResponse.json({ success: true, data: wasteLog }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không hủy được hàng'
    const status = ['Lô hàng không tồn tại', 'Số lượng hủy vượt quá tồn thực tế'].includes(message) ? 400 : 500
    console.error('[POST /api/kho-hang/huy-hang] Error:', error)
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
