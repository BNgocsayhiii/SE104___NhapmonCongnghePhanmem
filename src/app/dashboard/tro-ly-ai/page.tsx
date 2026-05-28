'use client'

import { KeyboardEvent } from 'react'
import { useTroLyAI } from '@/hooks/useTroLyAI'
import ReactMarkdown from 'react-markdown'

const guavaColors = {
  primary: '#60A61F',      
  textDark: '#1a4d2e',     
  mainBg: '#f8faf7',       
}

const floatingFruits = [
  { icon: '🍎', pos: 'top-[8%] left-[5%]', delay: '0s' },
  { icon: '🍐', pos: 'top-[15%] right-[12%]', delay: '1s' },
  { icon: '🍒', pos: 'top-[28%] left-[40%]', delay: '1.9s' },
  { icon: '🍇', pos: 'top-[40%] right-[10%]', delay: '0.5s' },
  { icon: '🥭', pos: 'top-[50%] left-[8%]', delay: '2s' },
  { icon: '🍊', pos: 'top-[62%] left-[62%]', delay: '3.5s' },
  { icon: '🍌', pos: 'top-[70%] left-[30%]', delay: '2.7s' },
  { icon: '🍓', pos: 'top-[82%] right-[8%]', delay: '2.5s' },
  { icon: '🍈', pos: 'top-[88%] left-[15%]', delay: '1.5s' },
  { icon: '🥝', pos: 'top-[96%] left-[55%]', delay: '3s' },
  { icon: '🍑', pos: 'top-[20%] left-[25%]', delay: '0.8s' },
]

const QUICK_PROMPTS = [
  { emoji: '📦', label: 'Tình trạng kho', text: 'Hàng nào đang sắp hết hoặc sắp hết hạn?' },
  { emoji: '📈', label: 'Doanh thu', text: 'Phân tích doanh thu và lợi nhuận gần đây cho tôi.' },
  { emoji: '🛒', label: 'Gợi ý nhập', text: 'Tôi nên nhập thêm hàng gì dựa trên doanh số hiện tại?' },
  { emoji: '👋', label: 'Trò chuyện', text: 'Chào bạn, hôm nay có gì vui không?' },
]

export default function TroLyAIPage() {
  const {
    messages,
    isLoading,
    input,
    setInput,
    sendMessage,
    clearChat,
    messagesEndRef,
  } = useTroLyAI()

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fade-up p-6 relative min-h-full flex flex-col z-0 bg-transparent font-sans">
      
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        
        .floating-fruit {
          position: absolute;
          animation: float 6s ease-in-out infinite;
          opacity: 0.25;
          font-size: 1.7rem; 
        }

        .chat-container {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(228, 231, 225, 0.7);
          border-radius: 20px;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #ECEDDF;
          border-radius: 10px;
        }
      `}</style>

      {/* Lớp trái cây nền */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {floatingFruits.map((fruit, index) => (
          <span key={index} className={`floating-fruit ${fruit.pos}`} style={{ animationDelay: fruit.delay }}>
            {fruit.icon}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        
        {/* Header - Có kèm nút Làm mới đặt gọn gàng bên phải */}
        <div className="mb-6 flex flex-row items-end justify-between gap-4 border-b border-dashed border-slate-200 pb-4">
          <div className="text-left">
            <h1 style={{ fontFamily: 'var(--font-title)', color: guavaColors.textDark }} className="text-4xl uppercase mb-1">
              TRỢ LÝ AI
            </h1>
            <p className="text-slate-500 text-sm font-medium">Tương tác dữ liệu kho hàng & Trò chuyện thông minh</p>
          </div>
          
          <button 
            onClick={clearChat}
            style={{ color: guavaColors.textDark }}
            className="px-4 py-2 text-xs font-bold border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 rounded-xl shadow-sm transition-all text-center"
          >
            🔄 Làm mới cuộc trò chuyện
          </button>
        </div>

        {/* Bố cục chính - Đã xóa hoàn toàn Sidebar, khung chat chiếm 100% chiều ngang */}
        <div className="w-full flex flex-col chat-container shadow-sm h-[650px] overflow-hidden">
          
          {/* Vùng hiển thị tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 custom-scrollbar bg-white/40">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border text-base ${
                  msg.role === 'user' 
                    ? 'bg-[#CBEFAA] border-[#a5df7a] text-slate-800' 
                    : 'bg-white border-slate-200'
                }`}>
                  {msg.role === 'user' ? '👤' : '🍓'}
                </div>

                <div className="flex flex-col max-w-[85%] md:max-w-[80%]">
                  <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed border shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#60A61F] border-[#528f1a] text-white rounded-tr-none' 
                      : msg.isError 
                        ? 'bg-red-50 border-red-200 text-red-800 rounded-tl-none'
                        : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    <div className={`prose max-w-none text-sm break-words
                      prose-p:leading-relaxed prose-strong:font-black prose-ul:list-disc prose-ul:pl-4
                      ${msg.role === 'user' ? 'prose-strong:text-yellow-200 text-white' : 'prose-strong:text-[#1a4d2e]'}`}>
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <span className={`text-[10px] text-slate-400 mt-1.5 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 mr-auto">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">🍓</div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-xs">
                  <div style={{ backgroundColor: guavaColors.primary }} className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div style={{ backgroundColor: guavaColors.primary }} className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div style={{ backgroundColor: guavaColors.primary }} className="w-2 h-2 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200/60 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              
              {/* Câu hỏi gợi ý nhanh */}
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(p.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#60A61F] text-slate-600 hover:text-[#60A61F] hover:bg-emerald-50/50 rounded-full text-[13px] font-medium transition-all shadow-sm"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-end bg-white border border-slate-200 rounded-xl p-2 focus-within:border-[#60A61F] focus-within:ring-2 focus-within:ring-[#60A61F]/10 transition-all shadow-xs">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Trò chuyện bất kỳ hoặc hỏi số liệu kho hàng..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-sm p-1.5 max-h-24 text-slate-800 placeholder-slate-400 focus:ring-0"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  style={{ backgroundColor: input.trim() && !isLoading ? guavaColors.primary : '#e2e8f0' }}
                  className="h-9 w-9 text-white font-bold rounded-lg transition-all flex items-center justify-center shrink-0 shadow-xs hover:opacity-90 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}