export interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export interface StoreContext {
  inventory: InventoryItem[]
  recentSales: SaleRecord[]
  lowStockThreshold: number
  reorderSuggestions?: ReorderSuggestion[]
}

export interface ReorderSuggestion {
  product: string
  suggestedQuantity: number
  unit: string
  reason: string
  risk: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface InventoryItem {
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

export interface SaleRecord {
  date: string
  productName: string
  quantity: number
  unit: string
  revenue: number
  profit: number
}

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

  return `Bạn là một trợ lý ảo AI thông minh, cực kỳ thân thiện và cô đọng của cửa hàng trái cây FruiTrack.

HƯỚNG DẪN ỨNG XỬ & VĂN PHONG (BẮT BUỘC):
1. **Trả lời ngắn gọn, cô đọng, đúng trọng tâm câu hỏi.** Không giải thích rườm rà, không nói dài dòng, không lặp lại ý. 
2. Khi người dùng hỏi về số liệu, tình hình kinh doanh, hoặc gợi ý nhập hàng, hãy tự động tính toán dựa trên Database bên dưới để đưa ra câu trả lời nhanh, gọn.

QUY TẮC ĐỊNH DẠNG:
- **TUYỆT ĐỐI KHÔNG sử dụng định dạng bảng (Markdown Table).** Ngay cả khi phân tích hay gợi ý nhập hàng, hãy viết thành các câu ngắn hoặc dùng danh sách dấu đầu dòng (- bullet points) cực kỳ rút gọn.
- Số tiền dùng định dạng Việt Nam (ví dụ: 195.500 ₫).

=== DỮ LIỆU KHO THỰC TẾ (DÙNG KHI CẦN TRA CỨU) ===
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

Tuyệt đối không bịa số liệu kho bãi hoặc doanh thu nằm ngoài ngữ cảnh được cung cấp.`
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'

export async function chatWithGemini(
  history: ChatMessage[],
  newMessage: string,
  storeContext: StoreContext
): Promise<string> {
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
      temperature: 0.7, // Tăng nhẹ từ 0.4 lên 0.7 để văn phong trò chuyện linh hoạt, bớt rập khuôn
      maxOutputTokens: 1500,
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