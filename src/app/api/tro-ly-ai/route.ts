import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { chatWithGemini, type ChatMessage, type ReorderSuggestion, type StoreContext } from '@/lib/gemini'
import { apiError, requireSession } from '@/lib/api'
 
const prisma = new PrismaClient()
 
// ── Fetch & build StoreContext từ DB thật ────────────────────────────────
 
async function buildStoreContext(): Promise<StoreContext> {
  // 1. Lấy tất cả lô hàng còn tồn kho (FRESH + NEAR_EXPIRY)
  const activeBatches = await prisma.batch.findMany({
    where: {
      status: { in: ['FRESH', 'NEAR_EXPIRY'] },
      effectiveRemaining: { gt: 0 },
    },
    include: {
      product: {
        include: { category: true },
      },
      importReceipt: {
        include: { supplier: true },
      },
    },
    orderBy: { expiredAt: 'asc' }, // FIFO
  })
 
  // Gộp nhiều lô cùng sản phẩm thành 1 InventoryItem
  const inventoryMap = new Map<
    string,
    {
      id: string
      name: string
      category: string
      quantity: number
      unit: string
      costPrice: number
      sellPrice: number
      expiryDate?: string
      supplier?: string
    }
  >()
 
  for (const batch of activeBatches) {
    const pid = batch.productId
    const existing = inventoryMap.get(pid)
 
    // Lấy HSD gần nhất (lô đầu tiên theo FIFO)
    const expiryDate = batch.expiredAt.toISOString().split('T')[0]
 
    if (existing) {
      existing.quantity += batch.effectiveRemaining
      // Giữ HSD sớm nhất
      if (!existing.expiryDate || expiryDate < existing.expiryDate) {
        existing.expiryDate = expiryDate
      }
    } else {
      inventoryMap.set(pid, {
        id: pid,
        name: batch.product.name,
        category: batch.product.category.name,
        quantity: batch.effectiveRemaining,
        unit: batch.product.unit,
        costPrice: batch.importPrice,
        sellPrice: batch.product.currentPrice,
        expiryDate,
        supplier: batch.importReceipt.supplier.name,
      })
    }
  }
 
  const inventory = Array.from(inventoryMap.values())
 
  // 2. Lấy doanh thu 30 ngày gần nhất
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
 
  const recentInvoiceItems = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        status: { in: ['PAID', 'DELIVERED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
    },
    include: {
      product: true,
      batch: true,
      invoice: {
        select: { createdAt: true },
      },
    },
  })
 
  const recentSales = recentInvoiceItems.map((item) => {
    const revenue = item.subtotal - item.discountAmount
    const cost = item.batch.importPrice * item.quantity
    return {
      date: item.invoice.createdAt.toISOString().split('T')[0],
      productName: item.product.name,
      quantity: item.quantity,
      unit: item.product.unit,
      revenue,
      profit: revenue - cost,
    }
  })
 
  const salesMap = new Map<string, { quantity: number; unit: string }>()
  for (const sale of recentSales) {
    const existing = salesMap.get(sale.productName)
    if (existing) existing.quantity += sale.quantity
    else salesMap.set(sale.productName, { quantity: sale.quantity, unit: sale.unit })
  }

  const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const reorderSuggestions: ReorderSuggestion[] = inventory
    .map(item => {
      const sales = salesMap.get(item.name)
      const sold30Days = sales?.quantity ?? 0
      const dailySales = sold30Days / 30
      const daysCover = dailySales > 0 ? item.quantity / dailySales : Number.POSITIVE_INFINITY
      const expiryDays = item.expiryDate ? Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000) : 999
      const priority: ReorderSuggestion['priority'] = item.quantity <= 2 || daysCover <= 2 ? 'HIGH' : item.quantity <= 5 || daysCover <= 5 ? 'MEDIUM' : 'LOW'
      const suggestedQuantity = Math.max(0, Math.ceil(Math.max(dailySales * 7 - item.quantity, item.quantity <= 2 ? 5 : 0)))
      return {
        product: item.name,
        suggestedQuantity,
        unit: item.unit,
        reason: sold30Days > 0 ? `Đã bán ${sold30Days.toFixed(1)} ${item.unit} trong 30 ngày, còn ${item.quantity.toFixed(1)} ${item.unit}` : `Tồn còn ${item.quantity.toFixed(1)} ${item.unit}, chưa có doanh số 30 ngày`,
        risk: expiryDays <= 3 ? `Có lô gần/hết hạn trong ${expiryDays} ngày, không nên nhập nhiều` : daysCover <= 5 ? `Có thể hết hàng trong khoảng ${Math.max(1, Math.ceil(daysCover))} ngày` : 'Rủi ro thấp',
        priority,
      }
    })
    .filter(item => item.suggestedQuantity > 0 || item.priority !== 'LOW')
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 8)

  return {
    inventory,
    recentSales,
    lowStockThreshold: 5, // < 5 kg/đơn vị coi là sắp hết
    reorderSuggestions,
  }
}
 
// ── POST handler ─────────────────────────────────────────────────────────
 
export async function POST(req: NextRequest) {
  try {
    const { response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const body = await req.json()
    const { history, message } = body as {
      history: ChatMessage[]
      message: string
    }
 
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 })
    }
 
    const storeContext = await buildStoreContext()
    const reply = await chatWithGemini(history ?? [], message, storeContext)
 
    return NextResponse.json({ reply, storeContext, reorderSuggestions: storeContext.reorderSuggestions })
  } catch (err) {
    console.error('[tro-ly-ai] error:', err)
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return apiError(message)
  } finally {
    await prisma.$disconnect()
  }
}
 
// ── GET handler: chỉ trả về context (dùng khi load trang) ────────────────
 
export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSession(req, ['MANAGER'])
    if (response) return response

    const storeContext = await buildStoreContext()
    return NextResponse.json({ storeContext, reorderSuggestions: storeContext.reorderSuggestions })
  } catch (err) {
    console.error('[tro-ly-ai] GET error:', err)
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return apiError(message)
  } finally {
    await prisma.$disconnect()
  }
}
