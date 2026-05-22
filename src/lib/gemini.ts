export interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export interface StoreContext {
  inventory: InventoryItem[]
  recentSales: SaleRecord[]
  lowStockThreshold: number
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number   // kg hoặc đơn vị
  unit: string
  costPrice: number  // giá nhập (₫/kg)
  sellPrice: number  // giá bán (₫/kg)
  expiryDate?: string
  supplier?: string
}

export interface SaleRecord {
  date: string
  productName: string
  quantity: number
  unit: string
  revenue: number
  profit: number
}

// ── System prompt: định nghĩa vai trò AI ──────────────────────────────────

export function buildSystemPrompt(ctx: StoreContext): string {
  const lowStock = ctx.inventory.filter((i) => i.quantity <= ctx.lowStockThreshold)
  const expiringSoon = ctx.inventory.filter((i) => {
    if (!i.expiryDate) return false
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86_400_000)
    return days >= 0 && days <= 3
  })

  const totalRevenue = ctx.recentSales.reduce((s, r) => s + r.revenue, 0)
  const totalProfit  = ctx.recentSales.reduce((s, r) => s + r.profit, 0)

  const topSellers = [...ctx.recentSales]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((r) => `${r.productName} (${r.revenue.toLocaleString('vi-VN')}₫)`)
    .join(', ')

  return `Bạn là trợ lý AI của cửa hàng trái cây FruiTrack. Hãy trả lời ngắn gọn, thực tế, bằng tiếng Việt.
Khi trình bày danh sách, dùng markdown bullet (- item). Khi trình bày số tiền, dùng định dạng Việt Nam (ví dụ: 1.250.000 ₫).

=== DỮ LIỆU KHO HIỆN TẠI ===
Tổng số mặt hàng: ${ctx.inventory.length}
Hàng sắp hết (≤${ctx.lowStockThreshold} ${ctx.inventory[0]?.unit ?? 'kg'}):
${lowStock.length > 0 ? lowStock.map((i) => `- ${i.name}: còn ${i.quantity} ${i.unit} (giá nhập ${i.costPrice.toLocaleString('vi-VN')}₫/${i.unit}, NCC: ${i.supplier ?? 'chưa rõ'})`).join('\n') : '- Không có'}

Hàng sắp hết hạn (≤3 ngày):
${expiringSoon.length > 0 ? expiringSoon.map((i) => `- ${i.name}: HSD ${i.expiryDate}, còn ${i.quantity} ${i.unit}`).join('\n') : '- Không có'}

Toàn bộ kho:
${ctx.inventory.map((i) => `- ${i.name} (${i.category}): ${i.quantity} ${i.unit}, giá bán ${i.sellPrice.toLocaleString('vi-VN')}₫/${i.unit}`).join('\n')}

=== DOANH THU GẦN ĐÂY ===
Tổng doanh thu: ${totalRevenue.toLocaleString('vi-VN')} ₫
Tổng lợi nhuận: ${totalProfit.toLocaleString('vi-VN')} ₫
Top bán chạy: ${topSellers || 'chưa có dữ liệu'}

Chi tiết bán hàng:
${ctx.recentSales.map((r) => `- ${r.date}: ${r.productName} ${r.quantity}${r.unit} → ${r.revenue.toLocaleString('vi-VN')}₫ (lợi nhuận ${r.profit.toLocaleString('vi-VN')}₫)`).join('\n')}

=== NHIỆM VỤ ===
Khi được hỏi về tình trạng kho → dựa vào dữ liệu kho ở trên.
Khi được hỏi về doanh thu → dựa vào dữ liệu bán hàng ở trên.
Khi được yêu cầu gợi ý nhập hàng → phân tích hàng sắp hết + bán chạy + lợi nhuận để đề xuất cụ thể số lượng nên nhập.
Không bịa số liệu ngoài dữ liệu được cung cấp.`
}

// ── Main chat function ─────────────────────────────────────────────────────

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function chatWithGemini(
  history: ChatMessage[],
  newMessage: string,
  storeContext: StoreContext
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error('Thiếu NEXT_PUBLIC_GEMINI_API_KEY trong .env.local')

  const systemPrompt = buildSystemPrompt(storeContext)

  // Ghép system prompt vào tin nhắn đầu tiên của user (Gemini 2.0 Flash hỗ trợ system_instruction)
  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      ...history,
      { role: 'user', parts: [{ text: newMessage }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini API lỗi ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '(Không có phản hồi)'
}