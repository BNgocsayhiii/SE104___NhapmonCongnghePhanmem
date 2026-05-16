'use client'
import React, { useEffect, useState } from 'react'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  points: number
}

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="fade-up">
      <style>{`
        .customer-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          position: relative;
          transition: all 0.2s ease;
        }
        .customer-card:hover {
          border-color: #4a9b5c;
          box-shadow: 0 10px 20px -10px rgba(74, 155, 92, 0.1);
        }
        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f0faf3;
          color: #4a9b5c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }
      `}</style>

      {/* Header & Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl text-[#1a4d2e]">Khách hàng</h1>
        <button className="bg-[#4a9b5c] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#3d834d] transition-all shadow-sm">
          <span>+</span> Thêm khách hàng
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-md">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm kiếm khách hàng..." 
            className="w-full h-11 bg-white border border-slate-200 rounded-xl px-10 text-sm outline-none focus:border-[#4a9b5c] transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
      </div>

      {/* Grid Danh sách khách hàng */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((c) => (
            <div key={c.id} className="customer-card">
              {/* Nút 3 chấm giả lập */}
              <button className="absolute top-4 right-4 text-slate-300 hover:text-slate-600">⋮</button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="avatar-circle">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-[#1a4d2e] leading-none mb-1">{c.name}</h3>
                  <p className="text-xs text-slate-400">📞 {c.phone}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>✉️</span> {c.email}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>📍</span> {c.address || 'Chưa cập nhật địa chỉ'}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                  <span>⭐</span> {c.points} điểm tích lũy
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}