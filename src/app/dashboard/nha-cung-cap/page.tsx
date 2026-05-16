'use client'
import React, { useState } from 'react'
 
const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
  .input-field { border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; width:100%; outline:none; transition:border .15s; font-family:inherit; }
  .input-field:focus { border-color:#4a9b5c; box-shadow:0 0 0 3px rgba(74,155,92,.1); }
  .btn-primary { background:#4a9b5c; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
  .btn-primary:hover { background:#3d8c5a; }
  .supplier-card { background:#fff; border:1px solid #e8f0eb; border-radius:14px; padding:18px; transition:all .2s; }
  .supplier-card:hover { box-shadow:0 4px 16px rgba(74,155,92,.1); border-color:#c6deca; }
`
 
const suppliers = [
  { id:'NCC001', name:'Vựa Hoa Quả Miền Bắc', contact:'Anh Hùng', phone:'024 3456 7890', email:'vnmb@email.com', address:'Hà Nội', type:'Trong nước', orders:12, totalSpend:28500000, rating:4.8, products:'Vải thiều, Đào, Mận' },
  { id:'NCC002', name:'Trái Cây Miền Tây',     contact:'Chị Lan',  phone:'0270 1234 567', email:'tcmt@email.com', address:'Tiền Giang', type:'Trong nước', orders:8, totalSpend:18900000, rating:4.5, products:'Xoài, Sầu riêng, Bưởi' },
  { id:'NCC003', name:'Nhập Khẩu Thăng Long',  contact:'Anh Đức',  phone:'024 9876 5432', email:'nktl@email.com', address:'Hà Nội',    type:'Nhập khẩu', orders:5, totalSpend:42000000, rating:4.9, products:'Nho, Táo, Lê ngoại' },
  { id:'NCC004', name:'Vựa Đà Lạt Tươi Ngon',  contact:'Chị Mai',  phone:'0263 456 789',  email:'dlt@email.com',  address:'Lâm Đồng', type:'Trong nước', orders:6, totalSpend:12300000, rating:4.3, products:'Dâu tây, Bơ, Hồng' },
]
 
export default function NhaCungCapPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', contact:'', phone:'', email:'', address:'', type:'Trong nước', products:'' })
 
  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.products.toLowerCase().includes(search.toLowerCase())
  )
 
  return (
    <div>
      <style>{pageStyle}</style>
 
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#1a4d2e] mb-0.5">Nhà cung cấp</h1>
          <p className="text-slate-400 text-xs">Quản lý danh sách nhà cung cấp và lịch sử hợp tác</p>
        </div>
        <div className="flex gap-3">
          <input className="input-field" style={{ width: 220 }} placeholder="🔍  Tìm nhà cung cấp..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Thêm NCC</button>
        </div>
      </div>
 
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Tổng nhà cung cấp', value:'4',          icon:'🏭', color:'#4a9b5c' },
          { label:'Trong nước',        value:'3',          icon:'🇻🇳', color:'#3b82f6' },
          { label:'Nhập khẩu',         value:'1',          icon:'✈️', color:'#8b5cf6' },
          { label:'Chi phí tháng này', value:'42.5M ₫',   icon:'💰', color:'#1a4d2e' },
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
 
      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-[#1a4d2e] mb-4">Thêm nhà cung cấp mới</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label:'Tên nhà cung cấp', key:'name', placeholder:'Tên công ty/cá nhân' },
              { label:'Người liên hệ',    key:'contact', placeholder:'Họ và tên' },
              { label:'Số điện thoại',    key:'phone', placeholder:'0xxx xxx xxx' },
              { label:'Email',            key:'email', placeholder:'email@domain.com' },
              { label:'Địa chỉ',          key:'address', placeholder:'Tỉnh/Thành phố' },
              { label:'Sản phẩm cung cấp',key:'products', placeholder:'Vải thiều, Xoài...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">{label}</label>
                <input className="input-field" placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="btn-primary">Lưu nhà cung cấp</button>
            <button onClick={() => setShowForm(false)} className="text-slate-500 text-sm px-4">Hủy</button>
          </div>
        </div>
      )}
 
      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="supplier-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: s.type === 'Nhập khẩu' ? '#ede9fe' : '#f0fdf4' }}>
                  {s.type === 'Nhập khẩu' ? '✈️' : '🏭'}
                </div>
                <div>
                  <p className="font-bold text-[#1a4d2e] text-sm">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.address} · {s.id}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${s.type === 'Nhập khẩu' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {s.type}
              </span>
            </div>
 
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label:'Đơn nhập', value: s.orders },
                { label:'Chi tiêu', value: `${(s.totalSpend/1000000).toFixed(1)}M ₫` },
                { label:'Đánh giá', value: `⭐ ${s.rating}` },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 text-center">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-bold text-[#1a4d2e] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
 
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span>📞 {s.phone}</span>
                <span>✉️ {s.email}</span>
              </div>
              <span className="text-[#4a9b5c] font-medium cursor-pointer hover:underline">Xem chi tiết →</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 truncate">🍑 {s.products}</p>
          </div>
        ))}
      </div>
    </div>
  )
}