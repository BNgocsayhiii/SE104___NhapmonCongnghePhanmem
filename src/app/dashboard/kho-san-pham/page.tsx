'use client'
import React, { useState } from 'react'
 
const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
  .input-field { border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; outline:none; transition:border .15s; font-family:inherit; }
  .input-field:focus { border-color:#4a9b5c; box-shadow:0 0 0 3px rgba(74,155,92,.1); }
  .btn-primary { background:#4a9b5c; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
  .btn-primary:hover { background:#3d8c5a; }
  .product-card { background:#fff; border:1px solid #e8f0eb; border-radius:14px; padding:18px; transition:box-shadow .2s, border-color .2s; }
  .product-card:hover { box-shadow:0 4px 16px rgba(74,155,92,.1); border-color:#c6deca; }
  .cat-chip { font-size:10px; padding:3px 9px; border-radius:20px; font-weight:600; }
`
 
const categories = ['Tất cả', 'Trái cây nhập khẩu', 'Trái cây nhiệt đới', 'Trái cây có múi', 'Trái cây miền núi']
 
const products = [
  { id: 'SP001', name: 'Nho Mẫu Đơn',        cat: 'Trái cây nhập khẩu',  icon: '🍇', unit: 'kg', sell: 280000, stock: 20, minStock: 5,  origin: 'Hàn Quốc' },
  { id: 'SP002', name: 'Sầu riêng Ri6',       cat: 'Trái cây nhiệt đới',  icon: '🍈', unit: 'kg', sell: 130000, stock: 6,  minStock: 8,  origin: 'Tiền Giang' },
  { id: 'SP003', name: 'Táo Envy',            cat: 'Trái cây nhập khẩu',  icon: '🍎', unit: 'kg', sell: 240000, stock: 15, minStock: 5,  origin: 'New Zealand' },
  { id: 'SP004', name: 'Bưởi da xanh',        cat: 'Trái cây có múi',     icon: '🍐', unit: 'kg', sell: 55000,  stock: 30, minStock: 10, origin: 'Bến Tre' },
  { id: 'SP005', name: 'Xoài cát Hòa Lộc',   cat: 'Trái cây nhiệt đới',  icon: '🥭', unit: 'kg', sell: 90000,  stock: 12, minStock: 5,  origin: 'Tiền Giang' },
  { id: 'SP006', name: 'Vải thiều Lục Ngạn',  cat: 'Trái cây miền núi',   icon: '🍒', unit: 'kg', sell: 110000, stock: 5,  minStock: 10, origin: 'Bắc Giang' },
]
 
export default function KhoSanPhamPage() {
  const [activeCat, setActiveCat] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
 
  const filtered = products.filter(p =>
    (activeCat === 'Tất cả' || p.cat === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )
 
  return (
    <div>
      <style>{pageStyle}</style>
 
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#1a4d2e] mb-0.5">Kho sản phẩm</h1>
          <p className="text-slate-400 text-xs">Danh mục tất cả sản phẩm đang kinh doanh</p>
        </div>
        <div className="flex gap-3 items-center">
          <input className="input-field" style={{ width: 200 }} placeholder="🔍  Tìm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            {(['grid', 'table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${view === v ? 'bg-[#4a9b5c] text-white' : 'text-slate-500'}`}>
                {v === 'grid' ? '⊞ Lưới' : '☰ Bảng'}
              </button>
            ))}
          </div>
          <button className="btn-primary">+ Thêm sản phẩm</button>
        </div>
      </div>
 
      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCat(c)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all ${
              activeCat === c
                ? 'bg-[#4a9b5c] text-white border-[#4a9b5c]'
                : 'bg-white text-slate-500 border-slate-200 hover:border-[#4a9b5c] hover:text-[#4a9b5c]'
            }`}>
            {c}
          </button>
        ))}
      </div>
 
      {view === 'grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="product-card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-[#f8faf7] rounded-xl flex items-center justify-center text-2xl">{p.icon}</div>
                {p.stock < p.minStock
                  ? <span className="cat-chip bg-red-100 text-red-600">Sắp hết</span>
                  : <span className="cat-chip bg-emerald-100 text-emerald-600">Còn hàng</span>
                }
              </div>
              <p className="font-bold text-[#1a4d2e] text-sm mb-0.5">{p.name}</p>
              <p className="text-[10px] text-slate-400 mb-3">{p.cat} · {p.origin}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Tồn kho</p>
                  <p className={`text-base font-bold ${p.stock < p.minStock ? 'text-red-500' : 'text-[#1a4d2e]'}`}>{p.stock} {p.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Giá bán</p>
                  <p className="text-sm font-bold text-[#4a9b5c]">{p.sell.toLocaleString()} ₫</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                {['Sản phẩm','Danh mục','Xuất xứ','Tồn kho','Giá bán','Trạng thái'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-[#f8faf7]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.icon}</span>
                      <span className="font-medium text-[#1a4d2e]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{p.cat}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{p.origin}</td>
                  <td className="px-5 py-3 font-bold text-[#1a4d2e]">{p.stock} {p.unit}</td>
                  <td className="px-5 py-3 font-bold text-[#4a9b5c]">{p.sell.toLocaleString()} ₫</td>
                  <td className="px-5 py-3">
                    {p.stock < p.minStock
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Sắp hết hàng</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">Còn hàng</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}