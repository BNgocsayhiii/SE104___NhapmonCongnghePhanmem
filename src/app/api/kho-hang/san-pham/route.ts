import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { apiError, apiMessage, apiSuccess, requireSession, writeAuditLog } from '@/lib/api'
import { formatZodError, productSchema } from '@/lib/validations'

const productInclude = {
  category: { select: { id: true, name: true } },
  _count: { select: { batches: true, invoiceItems: true } },
}

function uniqueError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return apiError('SKU hoặc tên sản phẩm đã tồn tại', { status: 400 })
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    const search = req.nextUrl.searchParams.get('search')?.trim()
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        include: productInclude,
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
    ])

    return apiSuccess({ products, categories })
  } catch (error) {
    console.error('[GET /api/kho-hang/san-pham] Error:', error)
    return apiError('Không tải được dữ liệu sản phẩm')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const parsed = productSchema.omit({ id: true }).safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const product = await prisma.product.create({
      data: parsed.data,
      include: productInclude,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'CREATE_PRODUCT',
      target: 'Product',
      targetId: product.id,
      newValue: product,
    })

    return apiMessage('Tạo sản phẩm thành công', product, { status: 201 })
  } catch (error) {
    const response = uniqueError(error)
    if (response) return response
    console.error('[POST /api/kho-hang/san-pham] Error:', error)
    return apiError('Không tạo được sản phẩm')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const parsed = productSchema.required({ id: true }).safeParse(await req.json())
    if (!parsed.success) return apiError(formatZodError(parsed.error), { status: 400 })

    const oldProduct = await prisma.product.findUnique({ where: { id: parsed.data.id }, include: productInclude })
    if (!oldProduct) return apiError('Sản phẩm không tồn tại', { status: 404 })

    const product = await prisma.product.update({
      where: { id: parsed.data.id },
      data: {
        sku: parsed.data.sku,
        name: parsed.data.name,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        unit: parsed.data.unit,
        currentPrice: parsed.data.currentPrice,
        evaporationRate: parsed.data.evaporationRate,
        shelfLifeDays: parsed.data.shelfLifeDays,
        categoryId: parsed.data.categoryId,
        status: parsed.data.status,
      },
      include: productInclude,
    })

    await writeAuditLog(prisma, {
      userId: session.id,
      action: oldProduct.categoryId === product.categoryId ? 'UPDATE_PRODUCT' : 'UPDATE_PRODUCT_CATEGORY',
      target: 'Product',
      targetId: product.id,
      oldValue: oldProduct,
      newValue: product,
    })

    return apiMessage('Cập nhật sản phẩm thành công', product)
  } catch (error) {
    const response = uniqueError(error)
    if (response) return response
    console.error('[PUT /api/kho-hang/san-pham] Error:', error)
    return apiError('Không cập nhật được sản phẩm')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return apiError('Thiếu sản phẩm cần xử lý', { status: 400 })

    const product = await prisma.product.findUnique({ where: { id }, include: productInclude })
    if (!product) return apiError('Sản phẩm không tồn tại', { status: 404 })

    if (product._count.batches > 0 || product._count.invoiceItems > 0) {
      const updated = await prisma.product.update({
        where: { id },
        data: { status: 'DISCONTINUED' },
        include: productInclude,
      })
      await writeAuditLog(prisma, {
        userId: session.id,
        action: 'DISCONTINUE_PRODUCT',
        target: 'Product',
        targetId: id,
        oldValue: product,
        newValue: updated,
      })
      return apiMessage('Sản phẩm đã phát sinh giao dịch nên được chuyển sang ngừng kinh doanh', updated)
    }

    await prisma.product.delete({ where: { id } })
    await writeAuditLog(prisma, {
      userId: session.id,
      action: 'DELETE_PRODUCT',
      target: 'Product',
      targetId: id,
      oldValue: product,
    })

    return apiMessage('Xóa sản phẩm thành công')
  } catch (error) {
    console.error('[DELETE /api/kho-hang/san-pham] Error:', error)
    return apiError('Không xóa được sản phẩm')
  }
}
