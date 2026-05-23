import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { chatWithGemini, type ChatMessage, type StoreContext } from '@/lib/gemini'
 
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
 
  return {
    inventory,
    recentSales,
    lowStockThreshold: 5, // < 5 kg/đơn vị coi là sắp hết
  }
}
 
// ── POST handler ─────────────────────────────────────────────────────────
 
export async function POST(req: Request) {
  try {
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
 
    return NextResponse.json({ reply, storeContext })
  } catch (err) {
    console.error('[tro-ly-ai] error:', err)
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
 
// ── GET handler: chỉ trả về context (dùng khi load trang) ────────────────
 
export async function GET() {
  try {
    const storeContext = await buildStoreContext()
    return NextResponse.json({ storeContext })
  } catch (err) {
    console.error('[tro-ly-ai] GET error:', err)
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}