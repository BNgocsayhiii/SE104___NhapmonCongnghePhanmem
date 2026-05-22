'use client'
import React, { useState, useRef, useEffect } from 'react'
import { chatWithGemini, type ChatMessage, type StoreContext } from '@/lib/gemini'

// ─── Mock store context (thay bằng data thật từ API/DB của bạn) ──────────────

const MOCK_CONTEXT: StoreContext = {
  lowStockThreshold: 5,
  inventory: [
    { id: 'SP001', name: 'Nho mẫu đơn',       category: 'Nhập khẩu',  quantity: 3,  unit: 'kg', costPrice: 120_000, sellPrice: 180_000, expiryDate: '2026-05-23', supplier: 'Công ty ABC' },
    { id: 'SP002', name: 'Sầu riêng Ri6',      category: 'Nhiệt đới',  quantity: 12, unit: 'kg', costPrice: 85_000,  sellPrice: 130_000, supplier: 'Vườn Cái Mơn' },
    { id: 'SP003', name: 'Táo Envy',           category: 'Nhập khẩu',  quantity: 4,  unit: 'kg', costPrice: 95_000,  sellPrice: 145_000, expiryDate: '2026-05-22', supplier: 'Công ty ABC' },
    { id: 'SP004', name: 'Bưởi da xanh',       category: 'Có múi',     quantity: 20, unit: 'kg', costPrice: 28_000,  sellPrice: 45_000,  supplier: 'HTX Bến Tre' },
    { id: 'SP005', name: 'Xoài cát Hòa Lộc',  category: 'Nhiệt đới',  quantity: 2,  unit: 'kg', costPrice: 55_000,  sellPrice: 85_000,  expiryDate: '2026-05-21', supplier: 'Vườn Tiền Giang' },
    { id: 'SP006', name: 'Dâu tây Đà Lạt',    category: 'Ôn đới',     quantity: 8,  unit: 'kg', costPrice: 70_000,  sellPrice: 110_000, supplier: 'HTX Đà Lạt' },
    { id: 'SP007', name: 'Thanh long ruột đỏ', category: 'Nhiệt đới',  quantity: 15, unit: 'kg', costPrice: 22_000,  sellPrice: 38_000,  supplier: 'Vườn Bình Thuận' },
    { id: 'SP008', name: 'Cherry Mỹ',          category: 'Nhập khẩu',  quantity: 1,  unit: 'kg', costPrice: 250_000, sellPrice: 380_000, expiryDate: '2026-05-22', supplier: 'Công ty XNK Sài Gòn' },
  ],
  recentSales: [
    { date: '21/05/2026', productName: 'Sầu riêng Ri6',      quantity: 5,  unit: 'kg', revenue: 650_000,   profit: 225_000 },
    { date: '21/05/2026', productName: 'Bưởi da xanh',       quantity: 8,  unit: 'kg', revenue: 360_000,   profit: 136_000 },
    { date: '20/05/2026', productName: 'Nho mẫu đơn',        quantity: 3,  unit: 'kg', revenue: 540_000,   profit: 180_000 },
    { date: '20/05/2026', productName: 'Táo Envy',           quantity: 4,  unit: 'kg', revenue: 580_000,   profit: 200_000 },
    { date: '19/05/2026', productName: 'Dâu tây Đà Lạt',    quantity: 6,  unit: 'kg', revenue: 660_000,   profit: 240_000 },
    { date: '19/05/2026', productName: 'Xoài cát Hòa Lộc',  quantity: 4,  unit: 'kg', revenue: 340_000,   profit: 120_000 },
    { date: '18/05/2026', productName: 'Cherry Mỹ',          quantity: 2,  unit: 'kg', revenue: 760_000,   profit: 260_000 },
    { date: '18/05/2026', productName: 'Thanh long ruột đỏ', quantity: 10, unit: 'kg', revenue: 380_000,   profit: 160_000 },
  ],
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: '📦', label: 'Tình trạng kho',      text: 'Tình trạng kho hiện tại thế nào? Mặt hàng nào sắp hết hoặc sắp hết hạn?' },
  { icon: '💰', label: 'Báo doanh thu',        text: 'Báo cáo nhanh doanh thu và lợi nhuận gần đây cho tôi.' },
  { icon: '🛒', label: 'Gợi ý nhập hàng',      text: 'Gợi ý cho tôi nên nhập thêm những mặt hàng nào và số lượng bao nhiêu?' },
  { icon: '📈', label: 'Hàng bán chạy',        text: 'Những mặt hàng nào đang bán chạy nhất? Tôi có nên tăng lượng nhập không?' },
  { icon: '⚠️', label: 'Hàng sắp hết hạn',    text: 'Liệt kê hàng sắp hết hạn và đề xuất cách xử lý.' },
  { icon: '💡', label: 'Tối ưu lợi nhuận',     text: 'Mặt hàng nào có biên lợi nhuận cao nhất? Tôi nên tập trung bán gì?' },
]

// ─── Markdown renderer (basic) ────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('### ')) {
      result.push(<p key={key++} style={{ fontWeight: 700, color: '#1a4d2e', margin: '10px 0 4px', fontSize: 13 }}>{line.slice(4)}</p>)
    } else if (line.startsWith('## ')) {
      result.push(<p key={key++} style={{ fontWeight: 700, color: '#1a4d2e', margin: '12px 0 4px', fontSize: 14 }}>{line.slice(3)}</p>)
    } else if (line.match(/^- /)) {
      result.push(
        <div key={key++} style={{ display: 'flex', gap: 7, margin: '2px 0', alignItems: 'flex-start' }}>
          <span style={{ color: '#4a9b5c', marginTop: 1, flexShrink: 0, fontSize: 12 }}>▸</span>
          <span style={{ fontSize: 13, lineHeight: 1.55, color: '#374151' }}>{parseBold(line.slice(2))}</span>
        </div>
      )
    } else if (line.trim() === '') {
      result.push(<div key={key++} style={{ height: 6 }} />)
    } else {
      result.push(<p key={key++} style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', margin: '2px 0' }}>{parseBold(line)}</p>)
    }
  }
  return result
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ color: '#1a4d2e' }}>{p.slice(2, -2)}</strong>
      : p
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  ts: string
}

export default function TroLyAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'Xin chào! Tôi là trợ lý AI của FruiTrack 🍃\n\nTôi có thể giúp bạn:\n- **Kiểm tra tình trạng kho** — hàng sắp hết, sắp hết hạn\n- **Báo doanh thu nhanh** — doanh thu, lợi nhuận gần đây\n- **Gợi ý nhập hàng** — phân tích và đề xuất cụ thể\n\nHãy chọn câu hỏi nhanh bên dưới hoặc nhập câu hỏi của bạn!',
      ts: now(),
    },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function now() {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  function buildHistory(): ChatMessage[] {
    return messages
      .filter((m) => m.id > 0) // skip welcome
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }))
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: Date.now(), role: 'user', text: trimmed, ts: now() }
    setMessages((p) => [...p, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const reply = await chatWithGemini(buildHistory(), trimmed, MOCK_CONTEXT)
      setMessages((p) => [...p, { id: Date.now() + 1, role: 'assistant', text: reply, ts: now() }])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
      setError(msg)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const c = { green: '#4a9b5c', textDark: '#1a4d2e', primary: '#60A61F' }

  return (
    <div style={{ fontFamily: "'Instrument Sans', sans-serif", display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');

        .ai-bubble-user {
          background: ${c.green};
          color: white;
          border-radius: 14px 14px 3px 14px;
          padding: 10px 14px;
          max-width: 72%;
          margin-left: auto;
          font-size: 13px;
          line-height: 1.55;
          box-shadow: 0 2px 8px rgba(74,155,92,0.25);
          word-break: break-word;
        }

        .ai-bubble-bot {
          background: white;
          border: 0.5px solid #eef3ec;
          border-radius: 3px 14px 14px 14px;
          padding: 12px 15px;
          max-width: 82%;
          font-size: 13px;
          line-height: 1.6;
          box-shadow: 0 2px 8px rgba(28,58,40,0.06);
          word-break: break-word;
        }

        .quick-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 11px; border-radius: 20px;
          border: 0.5px solid #d1e8d8;
          background: white;
          font-size: 11.5px; font-weight: 500; color: #3d7a52;
          cursor: pointer; transition: all 0.15s;
          white-space: nowrap;
          font-family: 'Instrument Sans', sans-serif;
        }
        .quick-chip:hover {
          background: #f0f7f2;
          border-color: ${c.green};
          box-shadow: 0 2px 8px rgba(74,155,92,0.12);
          transform: translateY(-1px);
        }

        .ai-input-area {
          display: flex; align-items: flex-end; gap: 8px;
          padding: 10px 14px;
          background: white;
          border: 0.5px solid #e2e8f0;
          border-radius: 12px;
          transition: border-color 0.15s;
        }
        .ai-input-area:focus-within {
          border-color: ${c.green};
          box-shadow: 0 0 0 3px rgba(74,155,92,0.08);
        }
        .ai-textarea {
          flex: 1; border: none; outline: none; resize: none;
          font-size: 13px; color: #1e293b; background: transparent;
          font-family: 'Instrument Sans', sans-serif;
          line-height: 1.5; max-height: 120px; overflow-y: auto;
          scrollbar-width: none;
        }
        .ai-textarea::-webkit-scrollbar { display: none; }
        .ai-textarea::placeholder { color: #94a3b8; }

        .ai-send-btn {
          width: 34px; height: 34px; border-radius: 9px; border: none;
          background: ${c.green}; color: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: all 0.15s; font-size: 15px;
        }
        .ai-send-btn:hover { background: #3d8c50; transform: scale(1.05); }
        .ai-send-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; transform: none; }

        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${c.green}; opacity: 0.6;
          animation: typing-bounce 1.2s ease infinite;
          display: inline-block;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        .ai-ts {
          font-size: 10px; color: #b0bec5; margin-top: 4px;
          font-weight: 500;
        }

        .msg-row-user { display: flex; justify-content: flex-end; margin-bottom: 14px; }
        .msg-row-bot  { display: flex; justify-content: flex-start; gap: 8px; margin-bottom: 14px; }

        .bot-avatar {
          width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, #3d8c5a, #c8873a);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; margin-top: 2px;
          box-shadow: 0 2px 6px rgba(61,140,90,0.25);
        }

        .error-banner {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 9px;
          background: rgba(239,68,68,0.06);
          border: 0.5px solid rgba(239,68,68,0.2);
          font-size: 12px; color: #dc2626;
          margin-bottom: 10px;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: c.textDark, margin: '0 0 3px' }}>
            Trợ lý AI
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0 }}>
            Hỏi về kho hàng, doanh thu, gợi ý nhập hàng — trả lời tức thì
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(74,155,92,0.08)', border: '0.5px solid rgba(74,155,92,0.2)', borderRadius: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px rgba(74,222,128,0.6)', animation: 'none' }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: c.textDark }}>Gemini 2.0 Flash</span>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        background: '#f8faf7', borderRadius: 12,
        border: '0.5px solid #eef3ec',
        marginBottom: 10, minHeight: 0,
        scrollbarWidth: 'none',
      }}>
        {messages.map((msg) => (
          msg.role === 'user' ? (
            <div key={msg.id} className="msg-row-user">
              <div>
                <div className="ai-bubble-user">{msg.text}</div>
                <p className="ai-ts" style={{ textAlign: 'right' }}>{msg.ts}</p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="msg-row-bot">
              <div className="bot-avatar">🍃</div>
              <div style={{ maxWidth: '82%' }}>
                <div className="ai-bubble-bot">
                  {renderMarkdown(msg.text)}
                </div>
                <p className="ai-ts">{msg.ts}</p>
              </div>
            </div>
          )
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="msg-row-bot">
            <div className="bot-avatar">🍃</div>
            <div className="ai-bubble-bot" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="error-banner">
          <i className="ti ti-alert-circle" style={{ fontSize: 14, flexShrink: 0 }} />
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13 }}>✕</button>
        </div>
      )}

      {/* ── Quick prompts ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {QUICK_PROMPTS.map((q) => (
          <button key={q.label} className="quick-chip" onClick={() => send(q.text)} disabled={loading}>
            <span>{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div className="ai-input-area">
        <textarea
          ref={inputRef}
          className="ai-textarea"
          rows={1}
          placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={handleKey}
        />
        <button
          className="ai-send-btn"
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          title="Gửi (Enter)"
        >
          <i className="ti ti-send" />
        </button>
      </div>

      {/* ── Footer hint ── */}
      <p style={{ fontSize: 10.5, color: '#b0bec5', textAlign: 'center', margin: '6px 0 0', fontWeight: 500 }}>
        Dữ liệu kho & doanh thu được cung cấp tự động cho AI · Powered by Google Gemini
      </p>
    </div>
  )
}
