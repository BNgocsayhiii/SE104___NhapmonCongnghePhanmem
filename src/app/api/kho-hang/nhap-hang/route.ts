import { NextRequest } from 'next/server'
import { BatchStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, requireSession, writeAuditLog } from '@/lib/api'

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
    const { response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response
    const filterType = req.nextUrl.searchParams.get('filterType') || 'month'
    const filterValue = req.nextUrl.searchParams.get('filterValue') || ''
    let receiptDateFilter: { gte?: Date; lt?: Date } | undefined
    if (filterValue) {
      if (filterType === 'day') {
        const start = new Date(`${filterValue}T00:00:00`)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        receiptDateFilter = { gte: start, lt: end }
      } else if (filterType === 'year') {
        const year = Number(filterValue)
        if (Number.isInteger(year)) receiptDateFilter = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) }
      } else {
        const [year, month] = filterValue.split('-').map(Number)
        if (year && month) receiptDateFilter = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) }
      }
    }

    const [products, suppliers, categories, receipts] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, sku: true, name: true, unit: true, currentPrice: true, shelfLifeDays: true },
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, phone: true, address: true },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.importReceipt.findMany({
        where: receiptDateFilter ? { createdAt: receiptDateFilter } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 80,
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

    return apiSuccess({
      products,
      suppliers,
      categories,
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
    })
  } catch (error) {
    console.error('[GET /api/kho-hang/nhap-hang] Error:', error)
    return apiError('Không tải được dữ liệu nhập hàng')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireSession(req, ['MANAGER', 'STAFF_WAREHOUSE'])
    if (response) return response

    const payload = await req.json()
    const { supplier, note, lines } = payload

    if (!lines || lines.length === 0) return apiError('Phiếu nhập phải có ít nhất 1 mặt hàng', { status: 400 })

    const result = await prisma.$transaction(async tx => {
      // 1. Xử lý Nhà cung cấp (Tạo mới nếu chưa có ID)
      let resolvedSupplierId = supplier.id
      if (!resolvedSupplierId) {
        const newSupplier = await tx.supplier.create({
          data: {
            name: supplier.name,
            phone: supplier.phone || null,
            address: supplier.address || null,
            contactPerson: supplier.contactPerson || null,
          }
        })
        resolvedSupplierId = newSupplier.id
      }

      // 2. Tính tổng tiền
      const totalAmount = lines.reduce((sum: number, line: any) => sum + (line.quantity * line.importPrice), 0)

      // 3. Tạo phiếu nhập
      const receipt = await tx.importReceipt.create({
        data: {
          receiptCode: await buildReceiptCode(tx),
          supplierId: resolvedSupplierId,
          totalAmount,
          note,
          receivedById: session.id,
        },
      })

      const batches = []
      const defaultCategory = await tx.category.findFirst() // Lấy tạm category đầu tiên nếu tạo mới ko truyền

      // 4. Xử lý từng lô hàng
      for (const line of lines) {
        let resolvedProductId = line.product.id
        let productShelfLife = 0

        // Nếu sản phẩm không có ID -> Tạo sản phẩm mới
        if (!resolvedProductId) {
          const generatedSku = line.product.sku || `SKU-${Date.now().toString().slice(-6)}`
          const newProduct = await tx.product.create({
            data: {
              sku: generatedSku,
              name: line.product.name,
              unit: line.product.unit || 'kg',
              currentPrice: Number(line.product.currentPrice) || Number(line.importPrice),
              shelfLifeDays: Number(line.product.shelfLifeDays) || 5,
              evaporationRate: 0, 
              categoryId: line.product.categoryId || defaultCategory?.id,
              status: 'ACTIVE',
            }
          })
          resolvedProductId = newProduct.id
          productShelfLife = newProduct.shelfLifeDays
        } else {
          // Sản phẩm cũ -> Lấy thông tin HSD
          const existingProduct = await tx.product.findUnique({ where: { id: resolvedProductId } })
          if (!existingProduct) throw new Error(`Sản phẩm ${line.product.name} không tồn tại`)
          productShelfLife = existingProduct.shelfLifeDays
        }

        // 5. Tính hạn sử dụng
        const expiredAt = new Date(line.packagedAt)
        expiredAt.setDate(expiredAt.getDate() + productShelfLife)

        // 6. Tạo Batch
        batches.push(await tx.batch.create({
          data: {
            batchCode: await buildBatchCode(tx),
            importReceiptId: receipt.id,
            productId: resolvedProductId,
            quantity: line.quantity,
            remaining: line.quantity,
            effectiveRemaining: line.quantity,
            importPrice: line.importPrice,
            packagedAt: new Date(line.packagedAt),
            expiredAt,
            status: getBatchStatus(expiredAt),
            createdById: session.id,
          },
          include: { product: { select: { name: true, unit: true } }, importReceipt: { select: { receiptCode: true } } },
        }))
      }

      await writeAuditLog(tx, {
        userId: session.id,
        action: 'CREATE_IMPORT_RECEIPT',
        target: 'ImportReceipt',
        targetId: receipt.id,
        newValue: { receipt, batches },
      })

      return { receipt, batches }
    })

    return apiSuccess(result, { status: 201 })
  } catch (error) {
    console.error('[POST /api/kho-hang/nhap-hang] Error:', error)
    return apiError(error instanceof Error ? error.message : 'Lỗi hệ thống khi nhập hàng', { status: 500 })
  }
}