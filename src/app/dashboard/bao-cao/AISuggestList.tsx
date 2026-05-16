'use client'
import { useEffect, useState } from 'react'

type Suggest = { name: string; unit: string; suggestQty: number; wastePct: number; reason: string }

const fruitEmoji: Record<string, string> = {
  'xoài': '🥭', 'dâu': '🍓', 'dưa': '🍉', 'cam': '🍊', 'bưởi': '🍊',
  'chuối': '🍌', 'nho': '🍇', 'táo': '🍎', 'ổi': '🍈', 'mít': '🍈',
}

function getEmoji(name: string) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(fruitEmoji)) {
    if (lower.includes(key)) return emoji
  }
  return '🛒'
}

export default function AISuggestList() {
  const [data, setData] = useState<Suggest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/ai-suggest')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-xs text-[#3b6d11] text-center py-4">Đang phân tích...</div>
  if (!data.length) return <div className="text-xs text-[#3b6d11] text-center py-4">Tồn kho đang đủ, không cần nhập gấp 👍</div>

  return (
    <div className="space-y-2">
      {data.map(item => (
        <div key={item.name} className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-[#c0dd97]">
          <span className="text-lg leading-none mt-0.5">{getEmoji(item.name)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700 truncate">{item.name}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-snug">{item.reason}</div>
          </div>
          <div className="text-sm font-semibold text-[#27500a] flex-shrink-0">
            {item.suggestQty} {item.unit}
          </div>
        </div>
      ))}
    </div>
  )
}