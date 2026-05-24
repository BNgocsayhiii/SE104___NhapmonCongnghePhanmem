import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { BatchStatus } from '@prisma/client'
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

function formatCodeDate(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

function getBatchStatus(expiredAt: Date) {
  const daysLeft = (expiredAt.getTime() - Date.now()) / 86400000
  if (daysLeft < 0) return BatchStatus.EXPIRED
  if (daysLeft <= 2) return BatchStatus.NEAR_EXPIRY
  return BatchStatus.FRESH
}

async function buildReceiptCode(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const count = await tx.importReceipt.count({ where: { createdAt: { gte: start } } })
  return `PN-${formatCodeDate(now)}-${String(count + 1).padStart(3, '0')}`
}

async function buildBatchCode(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const count = await tx.batch.count({ where: { createdAt: { gte: start } } })
  return `L-${formatCodeDate(now)}-${String(count + 1).padStart(3, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    if (session.role === 'STAFF_SALES') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền nhập hàng' }, { status: 403 })
    }

    const [products, suppliers, receipts] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, sku: true, name: true, unit: true, currentPrice: true, shelfLifeDays: true },
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, phone: true, address: true },
      }),
      prisma.importReceipt.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          supplier: { select: { name: true } },
          receivedBy: { select: { fullName: true } },
          batches: {
            include: { product: { select: { name: true, unit: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ])

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const monthCost = await prisma.importReceipt.aggregate({
      where: { createdAt: { gte: thisMonth } },
      _sum: { totalAmount: true },
      _count: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        products,
        suppliers,
        receipts: receipts.map(receipt => ({
          id: receipt.id,
          receiptCode: receipt.receiptCode,
          supplierName: receipt.supplier.name,
          receivedByName: receipt.receivedBy.fullName,
          totalAmount: receipt.totalAmount,
          note: receipt.note,
          createdAt: receipt.createdAt.toISOString(),
          batches: receipt.batches.map(batch => ({
            id: batch.id,
            batchCode: batch.batchCode,
            productName: batch.product.name,
            unit: batch.product.unit,
            quantity: batch.quantity,
            remaining: batch.remaining,
            effectiveRemaining: batch.effectiveRemaining,
            importPrice: batch.importPrice,
            packagedAt: batch.packagedAt.toISOString(),
            expiredAt: batch.expiredAt.toISOString(),
            status: batch.status,
          })),
        })),
        summary: {
          receiptCount: monthCost._count.id,
          monthCost: monthCost._sum.totalAmount ?? 0,
          productCount: products.length,
          supplierCount: suppliers.length,
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/kho-hang/nhap-hang] Error:', error)
    return NextResponse.json({ success: false, error: 'Không tải được dữ liệu nhập hàng' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    if (session.role === 'STAFF_SALES') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền nhập hàng' }, { status: 403 })
    }

    const body = await req.json()
    const supplierId = String(body.supplierId || '')
    const productId = String(body.productId || '')
    const quantity = Number(body.quantity || 0)
    const importPrice = Number(body.importPrice || 0)
    const packagedAt = body.packagedAt ? new Date(body.packagedAt) : new Date()
    const note = String(body.note || '').trim()

    if (!supplierId || !productId || quantity <= 0 || importPrice <= 0 || Number.isNaN(packagedAt.getTime())) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin hợp lệ' }, { status: 400 })
    }

    const result = await prisma.$transaction(async tx => {
      const [supplier, product] = await Promise.all([
        tx.supplier.findUnique({ where: { id: supplierId }, select: { id: true } }),
        tx.product.findUnique({ where: { id: productId }, select: { id: true, shelfLifeDays: true } }),
      ])
      if (!supplier) throw new Error('Nhà cung cấp không tồn tại')
      if (!product) throw new Error('Sản phẩm không tồn tại')

      const expiredAt = new Date(packagedAt)
      expiredAt.setDate(expiredAt.getDate() + product.shelfLifeDays)
      const totalAmount = quantity * importPrice

      const receipt = await tx.importReceipt.create({
        data: {
          receiptCode: await buildReceiptCode(tx),
          supplierId,
          totalAmount,
          note: note || undefined,
          receivedById: session.id,
        },
      })

      const batch = await tx.batch.create({
        data: {
          batchCode: await buildBatchCode(tx),
          importReceiptId: receipt.id,
          productId,
          quantity,
          remaining: quantity,
          effectiveRemaining: quantity,
          importPrice,
          packagedAt,
          expiredAt,
          status: getBatchStatus(expiredAt),
          createdById: session.id,
        },
        include: { product: { select: { name: true, unit: true } }, importReceipt: { select: { receiptCode: true } } },
      })

      return { receipt, batch }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không nhập được hàng'
    const status = ['Nhà cung cấp không tồn tại', 'Sản phẩm không tồn tại'].includes(message) ? 400 : 500
    console.error('[POST /api/kho-hang/nhap-hang] Error:', error)
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
