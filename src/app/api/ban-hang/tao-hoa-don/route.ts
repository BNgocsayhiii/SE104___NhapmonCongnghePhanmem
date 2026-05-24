import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireSession, writeAuditLog } from '@/lib/api'
import { formatZodError, invoiceCreateSchema } from '@/lib/validations'

const POINT_VALUE = 1000
const EARN_POINT_RATE = 10000

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
    const { response } = await requireSession(req, ['MANAGER', 'STAFF_SALES'])
    if (response) return response

    const search = req.nextUrl.searchParams.get('search')?.trim()

    const [products, customers] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
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

    return apiSuccess({ products, customers })
  } catch (error) {
    console.error('[GET /api/ban-hang/tao-hoa-don] Error:', error)
    return apiError('Không tải được dữ liệu bán hàng')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_SALES'])
    if (response) return response

    const parsed = invoiceCreateSchema.safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const body = parsed.data
    const invoice = await prisma.$transaction(async (tx) => {
      let customerId = body.customerId || undefined

      if (!customerId && body.customer?.phone && body.customer?.name) {
        const customer = await tx.customer.upsert({
          where: { phone: body.customer.phone },
          update: {
            name: body.customer.name,
            email: body.customer.email,
            address: body.customer.address,
          },
          create: {
            name: body.customer.name,
            phone: body.customer.phone,
            email: body.customer.email,
            address: body.customer.address,
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

      if (body.pointsUsed > 0 && !customerId) throw new Error('Cần chọn khách hàng để dùng điểm')
      if (body.pointsUsed > customerPoints) throw new Error('Số điểm không đủ')

      const invoiceCode = await buildInvoiceCode(tx)
      const invoiceItems: Array<{
        productId: string
        batchId: string
        quantity: number
        unitPrice: number
        subtotal: number
      }> = []

      for (const item of body.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, currentPrice: true, status: true },
        })
        if (!product || product.status !== 'ACTIVE') throw new Error('Sản phẩm không khả dụng')

        let remainingToSell = item.quantity
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
      const discount = Math.round(totalAmount * (body.discountPercent / 100))
      const pointDiscount = body.pointsUsed * POINT_VALUE
      const finalAmount = Math.max(totalAmount - discount - pointDiscount + body.shippingFee, 0)
      const pointsEarned = Math.floor(finalAmount / EARN_POINT_RATE)

      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceCode,
          customerId,
          totalAmount,
          discountPercent: body.discountPercent,
          discount: discount + pointDiscount,
          pointsUsed: body.pointsUsed,
          shippingFee: body.shippingFee,
          finalAmount,
          paymentMethod: body.paymentMethod,
          channel: body.channel,
          status: 'PAID',
          shippingAddress: body.shippingAddress || body.customer?.address,
          createdById: session.id,
          items: { create: invoiceItems },
        },
        include: {
          customer: { select: { name: true, phone: true, points: true } },
          items: {
            include: {
              product: { select: { name: true, unit: true } },
              batch: { select: { batchCode: true } },
            },
          },
        },
      })

      if (customerId && body.pointsUsed > 0) {
        await tx.pointTransaction.create({
          data: {
            customerId,
            invoiceId: createdInvoice.id,
            delta: -body.pointsUsed,
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

      if (customerId && (body.pointsUsed > 0 || pointsEarned > 0)) {
        await tx.customer.update({
          where: { id: customerId },
          data: { points: { increment: pointsEarned - body.pointsUsed } },
        })
      }

      await writeAuditLog(tx, {
        userId: session.id,
        action: 'CREATE_INVOICE',
        target: 'Invoice',
        targetId: createdInvoice.id,
        newValue: {
          invoiceCode,
          customerId,
          totalAmount,
          finalAmount,
          itemCount: invoiceItems.length,
        },
      })

      return createdInvoice
    })

    return apiSuccess(invoice, { status: 201 })
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
    return apiError(message, { status })
  }
}
