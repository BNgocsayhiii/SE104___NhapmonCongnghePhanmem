'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage, StoreContext } from '../lib/gemini'

export interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isError?: boolean
}

interface UseTroLyAIReturn {
  messages: DisplayMessage[]
  isLoading: boolean
  isContextLoading: boolean
  storeContext: StoreContext | null
  input: string
  setInput: (val: string) => void
  sendMessage: () => Promise<void>
  clearChat: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export function useTroLyAI(): UseTroLyAIReturn {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Chào bạn! Mình là AI hỗ trợ nhà FruiTrack đây 🍓.\nHôm nay kho bãi, doanh thu có gì cần mình tính toán hộ không, hay đơn giản là bạn muốn trò chuyện chém gió tí cho bớt căng thẳng? Cứ gõ vào bên dưới nhé!",
      timestamp: new Date(),
    },
  ])

  // history chỉ lưu các lượt user/model thực sự (không gồm welcome)
  const historyRef = useRef<ChatMessage[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [isContextLoading, setIsContextLoading] = useState(true)
  const [storeContext, setStoreContext] = useState<StoreContext | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load context ngay khi mount
  useEffect(() => {
    async function loadContext() {
      try {
        const res = await fetch('/api/tro-ly-ai')
        if (!res.ok) throw new Error('Không tải được dữ liệu kho')
        const data = await res.json()
        setStoreContext(data.storeContext)
      } catch (err) {
        console.error('[useTroLyAI] loadContext:', err)
      } finally {
        setIsContextLoading(false)
      }
    }
    loadContext()
  }, [])

  // Auto-scroll khi có tin mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/tro-ly-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyRef.current,
          message: trimmed,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }

      const reply: string = data.reply
      if (data.storeContext) setStoreContext(data.storeContext)

      // Cập nhật history cho lần sau
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', parts: [{ text: trimmed }] },
        { role: 'model', parts: [{ text: reply }] },
      ]

      const assistantMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ ${err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.'}`,
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading])

  const clearChat = useCallback(() => {
    historyRef.current = []
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Tôi có thể giúp gì cho bạn? 🍊',
        timestamp: new Date(),
      },
    ])
  }, [])

  return {
    messages,
    isLoading,
    isContextLoading,
    storeContext,
    input,
    setInput,
    sendMessage,
    clearChat,
    messagesEndRef,
  }
}