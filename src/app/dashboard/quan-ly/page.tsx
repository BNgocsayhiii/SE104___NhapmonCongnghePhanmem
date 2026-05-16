'use client'
import React, { useState } from 'react'
 
const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
  .table-row:hover { background: #f8faf7; }
  .input-field { border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; width:100%; outline:none; transition:border .15s; font-family:inherit; }
  .input-field:focus { border-color:#4a9b5c; box-shadow:0 0 0 3px rgba(74,155,92,.1); }
  .btn-primary { background:#4a9b5c; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
  .btn-primary:hover { background:#3d8c5a; }
  .progress-bar { height:5px; background:#e8f5ec; border-radius:3px; overflow:hidden; }
  .progress-fill { height:100%; background:#4a9b5c; border-radius:3px; transition:width .4s; }
  .progress-fill.warn { background:#f97316; }
  .progress-fill.danger { background:#ef4444; }
`
 
const batches = [
  { id: 'LH001', product: 'Vải thiều Lục Ngạn', supplier: 'Vựa Miền Bắc', imported: 50,  remaining: 5,  unit: 'kg', expiry: '2026-05-17', cost: 85000,  sell: 110000, icon: '🍒' },
  { id: 'LH002', product: 'Xoài cát Hòa Lộc',   supplier: 'Trái Cây Miền Tây', imported: 30, remaining: 12, unit: 'kg', expiry: '2026-05-20', cost: 65000,  sell: 90000,  icon: '🥭' },
  { id: 'LH003', product: 'Nho Mẫu Đơn',         supplier: 'Nhập khẩu TL',   imported: 20, remaining: 20, unit: 'kg', expiry: '2026-05-25', cost: 210000, sell: 280000, icon: '🍇' },
  { id: 'LH004', product: 'Sầu riêng Ri6',        supplier: 'Vựa Miền Tây',  imported: 40, remaining: 6,  unit: 'kg', expiry: '2026-05-18', cost: 95000,  sell: 130000, icon: '🍈' },
  { id: 'LH005', product: 'Táo Envy',             supplier: 'Nhập khẩu TL',  imported: 25, remaining: 15, unit: 'kg', expiry: '2026-06-01', cost: 180000, sell: 240000, icon: '🍎' },
]
 
function daysLeft(expiry: string) {
  const d = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
  return d
}
 
export default function QuanLyPage() {
  const [search, setSearch] = useState('')
  const filtered = batches.filter(b =>
    b.product.toLowerCase().includes(search.toLowerCase()) ||
    b.supplier.toLowerCase().includes(search.toLowerCase())
  )
 
  return (
    <div>
      <style>{pageStyle}</style>
 
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#1a4d2e] mb-0.5">Quản lý lô hàng</h1>
          <p className="text-slate-400 text-xs">Theo dõi tình trạng tất cả các lô hàng đang có</p>
        </div>
        <input className="input-field" style={{ width: 220 }} placeholder="🔍  Tìm lô hàng..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
 
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng lô hàng', value: '5', icon: '📦', color: '#4a9b5c' },
          { label: 'Sắp hết hạn (≤3 ngày)', value: '2', icon: '⏳', color: '#f97316' },
          { label: 'Cần bổ sung', value: '2', icon: '⚠️', color: '#ef4444' },
          { label: 'Tổng tồn kho', value: '58 kg', icon: '🏬', color: '#1a4d2e' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
              <p className="text-xl font-bold text-[#1a4d2e]">{s.value}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ background: `${s.color}15` }}>{s.icon}</div>
          </div>
        ))}
      </div>
 
      {/* Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map(b => {
          const pct = Math.round((b.remaining / b.imported) * 100)
          const days = daysLeft(b.expiry)
          const fillClass = days <= 2 ? 'danger' : days <= 5 ? 'warn' : ''
          return (
            <div key={b.id} className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f8faf7] rounded-xl flex items-center justify-center text-2xl">{b.icon}</div>
                  <div>
                    <p className="font-bold text-[#1a4d2e] text-sm">{b.product}</p>
                    <p className="text-[11px] text-slate-400">{b.supplier} · {b.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Giá nhập</p>
                    <p className="text-sm font-semibold text-slate-600">{b.cost.toLocaleString()} ₫/kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Giá bán</p>
                    <p className="text-sm font-bold text-[#4a9b5c]">{b.sell.toLocaleString()} ₫/kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Hạn dùng</p>
                    <p className={`text-sm font-bold ${days <= 2 ? 'text-red-500' : days <= 5 ? 'text-orange-500' : 'text-slate-600'}`}>
                      {days <= 0 ? 'Đã hết hạn' : `${days} ngày`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Còn lại</p>
                    <p className="text-sm font-bold text-[#1a4d2e]">{b.remaining}/{b.imported} kg</p>
                  </div>
                </div>
              </div>
              <div className="progress-bar">
                <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">Đã bán {b.imported - b.remaining} kg</span>
                <span className="text-[10px] text-slate-400">{pct}% còn tồn</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}