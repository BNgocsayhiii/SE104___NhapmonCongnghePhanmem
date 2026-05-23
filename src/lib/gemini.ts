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

// ── System prompt: Đã tối ưu hóa Token để chạy gói Free ─────────────────────
export function buildSystemPrompt(ctx: StoreContext): string {
  const lowStock = ctx.inventory.filter((i) => i.quantity <= ctx.lowStockThreshold)
  
  // Tính số ngày hết hạn chính xác hơn
  const expiringSoon = ctx.inventory.filter((i) => {
    if (!i.expiryDate) return false
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86_400_000)
    return days >= 0 && days <= 3
  })

  const totalRevenue = ctx.recentSales.reduce((s, r) => s + r.revenue, 0)
  const totalProfit  = ctx.recentSales.reduce((s, r) => s + r.profit, 0)

  // Tối ưu: Chỉ lấy Top 5 mặt hàng bán chạy nhất
  const topSellers = [...ctx.recentSales]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((r) => `${r.productName} (${r.revenue.toLocaleString('vi-VN')}₫)`)
    .join(', ')

  // TỐI ƯU: Thay vì map toàn bộ danh sách bán hàng thô (gây tốn token), 
  // chúng ta gom nhóm doanh số theo tên sản phẩm để AI dễ phân tích nhập hàng.
  const salesSummaryMap = new Map<string, { qty: number; rev: number; unit: string }>()
  for (const sale of ctx.recentSales) {
    const existing = salesSummaryMap.get(sale.productName)
    if (existing) {
      existing.qty += sale.quantity
      existing.rev += sale.revenue
    } else {
      salesSummaryMap.set(sale.productName, { qty: sale.quantity, rev: sale.revenue, unit: sale.unit })
    }
  }
  const salesSummaryStr = Array.from(salesSummaryMap.entries())
    .map(([name, stat]) => `- ${name}: đã bán ${stat.qty} ${stat.unit} → doanh thu ${stat.rev.toLocaleString('vi-VN')}₫`)
    .join('\n')

  return `Bạn là trợ lý AI của cửa hàng trái cây FruiTrack. Hãy trả lời ngắn gọn, thực tế, bằng tiếng Việt.
Khi trình bày danh sách, dùng markdown bullet (- item). Khi trình bày số tiền, dùng định dạng Việt Nam (ví dụ: 1.250.000 ₫).

=== DỮ LIỆU KHO HIỆN TẠI ===
Tổng số mặt hàng: ${ctx.inventory.length}
Hàng sắp hết (≤${ctx.lowStockThreshold}):
${lowStock.length > 0 ? lowStock.map((i) => `- ${i.name}: còn ${i.quantity} ${i.unit} (giá nhập ${i.costPrice.toLocaleString('vi-VN')}₫/${i.unit}, NCC: ${i.supplier ?? 'chưa rõ'})`).join('\n') : '- Không có'}

Hàng sắp hết hạn (≤3 ngày):
${expiringSoon.length > 0 ? expiringSoon.map((i) => `- ${i.name}: HSD ${i.expiryDate}, còn ${i.quantity} ${i.unit}`).join('\n') : '- Không có'}

Toàn bộ kho:
${ctx.inventory.map((i) => `- ${i.name} (${i.category}): ${i.quantity} ${i.unit}, giá bán ${i.sellPrice.toLocaleString('vi-VN')}₫/${i.unit}`).join('\n')}

=== DOANH THU & TIÊU THỤ 30 NGÀY ===
Tổng doanh thu: ${totalRevenue.toLocaleString('vi-VN')} ₫
Tổng lợi nhuận: ${totalProfit.toLocaleString('vi-VN')} ₫
Top bán chạy: ${topSellers || 'chưa có dữ liệu'}

Tóm tắt tiêu thụ mặt hàng:
${salesSummaryStr || '- Chưa có lượt bán nào'}

=== NHIỆM VỤ ===
Khi được hỏi về tình trạng kho → dựa vào dữ liệu kho ở trên.
Khi được hỏi về doanh thu → dựa vào tổng doanh thu/lợi nhuận ở trên.
Khi được yêu cầu gợi ý nhập hàng → ưu tiên đề xuất nhập các mặt hàng nằm trong danh sách "Hàng sắp hết" nhưng có "Tóm tắt tiêu thụ" tốt (bán được nhiều). Đề xuất số lượng thực tế dựa trên sức mua.
Tuyệt đối không bịa số liệu nằm ngoài ngữ cảnh được cung cấp.`
}

// ── Main chat function ─────────────────────────────────────────────────────

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function chatWithGemini(
  history: ChatMessage[],
  newMessage: string,
  storeContext: StoreContext
): Promise<string> {
  // ĐỔI LẠI: Dùng biến môi trường Server-side chuẩn để bảo mật và tránh lỗi Quota do leak key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Thiếu GEMINI_API_KEY trong file .env.local')

  const systemPrompt = buildSystemPrompt(storeContext)

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      ...history,
      { role: 'user', parts: [{ text: newMessage }] },
    ],
    generationConfig: {
      temperature: 0.4, // Giảm xuống 0.4 để câu trả lời chính xác, bám sát số liệu hơn, đỡ nói lan man
      maxOutputTokens: 800,
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