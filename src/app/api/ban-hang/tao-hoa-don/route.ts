import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-in-production')
const POINT_VALUE = 1000
const EARN_POINT_RATE = 10000

type CreateInvoiceItemInput = {
  productId: string
  batchId?: string
  quantity: number
}

type CreateInvoiceInput = {
  customerId?: string
  customer?: {
    name?: string
    phone?: string
    email?: string
    address?: string
  }
  items?: CreateInvoiceItemInput[]
  discountPercent?: number
  pointsUsed?: number
  shippingFee?: number
  paymentMethod?: 'CASH' | 'QR'
  channel?: 'POS' | 'ONLINE'
  shippingAddress?: string
}

async function getSession(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null

  const { payload } = await jwtVerify(token, SECRET)
  return {
    id: payload.id as string,
    role: payload.role as string,
  }
}

function asPositiveNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

async function buildInvoiceCode(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const count = await tx.invoice.count({ where: { createdAt: { gte: start } } })
  return `INV-${yy}${mm}${dd}-${String(count + 1).padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    if (session.role === 'STAFF_WAREHOUSE') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền tạo hóa đơn' }, { status: 403 })
    }

    const search = req.nextUrl.searchParams.get('search')?.trim()

    const [products, customers] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          ...(search
            ? { name: { contains: search, mode: 'insensitive' as const } }
            : {}),
          batches: {
            some: {
              status: { in: ['FRESH', 'NEAR_EXPIRY'] },
              effectiveRemaining: { gt: 0 },
            },
          },
        },
        include: {
          batches: {
            where: {
              status: { in: ['FRESH', 'NEAR_EXPIRY'] },
              effectiveRemaining: { gt: 0 },
            },
            orderBy: [{ expiredAt: 'asc' }, { createdAt: 'asc' }],
            select: {
              id: true,
              batchCode: true,
              remaining: true,
              effectiveRemaining: true,
              expiredAt: true,
              status: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: 50,
      }),
      prisma.customer.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          points: true,
        },
        take: 100,
      }),
    ])

    return NextResponse.json({ success: true, data: { products, customers } })
  } catch (error) {
    console.error('[GET /api/ban-hang/tao-hoa-don] Error:', error)
    return NextResponse.json({ success: false, error: 'Không tải được dữ liệu bán hàng' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    if (session.role === 'STAFF_WAREHOUSE') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền tạo hóa đơn' }, { status: 403 })
    }

    const body = (await req.json()) as CreateInvoiceInput
    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: 'Hóa đơn cần có ít nhất 1 sản phẩm' }, { status: 400 })
    }

    const normalizedItems = items.map((item) => ({
      productId: String(item.productId || ''),
      batchId: item.batchId ? String(item.batchId) : undefined,
      quantity: asPositiveNumber(item.quantity),
    }))

    if (normalizedItems.some((item) => !item.productId || !item.quantity)) {
      return NextResponse.json({ success: false, error: 'Dữ liệu sản phẩm không hợp lệ' }, { status: 400 })
    }

    const discountPercent = Math.min(Math.max(Number(body.discountPercent || 0), 0), 100)
    const pointsUsed = Math.max(Math.floor(Number(body.pointsUsed || 0)), 0)
    const shippingFee = Math.max(Number(body.shippingFee || 0), 0)
    const paymentMethod = body.paymentMethod === 'QR' ? 'QR' : 'CASH'
    const channel = body.channel || 'POS'

    const invoice = await prisma.$transaction(async (tx) => {
      let customerId = body.customerId || undefined

      if (!customerId && body.customer?.phone && body.customer?.name) {
        const customer = await tx.customer.upsert({
          where: { phone: body.customer.phone },
          update: {
            name: body.customer.name,
            email: body.customer.email || undefined,
            address: body.customer.address || undefined,
          },
          create: {
            name: body.customer.name,
            phone: body.customer.phone,
            email: body.customer.email || undefined,
            address: body.customer.address || undefined,
          },
        })
        customerId = customer.id
      }

      let customerPoints = 0
      if (customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { points: true },
        })
        if (!customer) throw new Error('Khách hàng không tồn tại')
        customerPoints = customer.points
      }

      if (pointsUsed > 0 && !customerId) throw new Error('Cần chọn khách hàng để dùng điểm')
      if (pointsUsed > customerPoints) throw new Error('Số điểm không đủ')

      const invoiceCode = await buildInvoiceCode(tx)
      const invoiceItems: Array<{
        productId: string
        batchId: string
        quantity: number
        unitPrice: number
        subtotal: number
      }> = []

      for (const item of normalizedItems) {
        const quantity = item.quantity as number
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, currentPrice: true, status: true },
        })
        if (!product || product.status !== 'ACTIVE') throw new Error('Sản phẩm không khả dụng')

        let remainingToSell = quantity
        const batches = await tx.batch.findMany({
          where: {
            productId: item.productId,
            ...(item.batchId ? { id: item.batchId } : {}),
            status: { in: ['FRESH', 'NEAR_EXPIRY'] },
            effectiveRemaining: { gt: 0 },
          },
          orderBy: [{ expiredAt: 'asc' }, { createdAt: 'asc' }],
        })

        for (const batch of batches) {
          if (remainingToSell <= 0) break
          const sellQuantity = Math.min(batch.effectiveRemaining, remainingToSell)
          await tx.batch.update({
            where: { id: batch.id },
            data: {
              remaining: { decrement: sellQuantity },
              effectiveRemaining: { decrement: sellQuantity },
            },
          })

          invoiceItems.push({
            productId: product.id,
            batchId: batch.id,
            quantity: sellQuantity,
            unitPrice: product.currentPrice,
            subtotal: sellQuantity * product.currentPrice,
          })
          remainingToSell -= sellQuantity
        }

        if (remainingToSell > 0) throw new Error('Tồn kho không đủ')
      }

      const totalAmount = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0)
      const discount = Math.round(totalAmount * (discountPercent / 100))
      const pointDiscount = pointsUsed * POINT_VALUE
      const finalAmount = Math.max(totalAmount - discount - pointDiscount + shippingFee, 0)
      const pointsEarned = Math.floor(finalAmount / EARN_POINT_RATE)

      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceCode,
          customerId,
          totalAmount,
          discountPercent,
          discount: discount + pointDiscount,
          pointsUsed,
          shippingFee,
          finalAmount,
          paymentMethod,
          channel,
          status: 'PAID',
          shippingAddress: body.shippingAddress || body.customer?.address || undefined,
          createdById: session.id,
          items: {
            create: invoiceItems,
          },
        },
        include: {
          customer: { select: { name: true, phone: true, points: true } },
          items: { include: { product: { select: { name: true, unit: true } }, batch: { select: { batchCode: true } } } },
        },
      })

      if (customerId && pointsUsed > 0) {
        await tx.pointTransaction.create({
          data: {
            customerId,
            invoiceId: createdInvoice.id,
            delta: -pointsUsed,
            reason: `Dùng điểm ${invoiceCode}`,
          },
        })
      }

      if (customerId && pointsEarned > 0) {
        await tx.pointTransaction.create({
          data: {
            customerId,
            invoiceId: createdInvoice.id,
            delta: pointsEarned,
            reason: `Tích điểm ${invoiceCode}`,
          },
        })
      }

      if (customerId && (pointsUsed > 0 || pointsEarned > 0)) {
        await tx.customer.update({
          where: { id: customerId },
          data: { points: { increment: pointsEarned - pointsUsed } },
        })
      }

      return createdInvoice
    })

    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không tạo được hóa đơn'
    const knownErrors = [
      'Khách hàng không tồn tại',
      'Cần chọn khách hàng để dùng điểm',
      'Số điểm không đủ',
      'Sản phẩm không khả dụng',
      'Tồn kho không đủ',
    ]
    const status = knownErrors.includes(message) ? 400 : 500
    console.error('[POST /api/ban-hang/tao-hoa-don] Error:', error)
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
