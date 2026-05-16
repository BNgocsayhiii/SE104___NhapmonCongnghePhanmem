'use client'
import React, { useState } from 'react'
 
const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
  .table-row:hover { background: #f8faf7; }
  .badge-pending { background: #fef3c7; color: #d97706; }
  .badge-done    { background: #dcfce7; color: #16a34a; }
  .badge-partial { background: #dbeafe; color: #2563eb; }
  .input-field {
    border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 8px 12px; font-size: 13px; width: 100%;
    outline: none; transition: border 0.15s;
    font-family: inherit;
  }
  .input-field:focus { border-color: #4a9b5c; box-shadow: 0 0 0 3px rgba(74,155,92,0.1); }
  .btn-primary {
    background: #4a9b5c; color: white;
    border: none; border-radius: 9px;
    padding: 9px 18px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
    font-family: inherit;
  }
  .btn-primary:hover { background: #3d8c5a; }
  .btn-ghost {
    background: transparent; color: #64748b;
    border: 1px solid #e2e8f0; border-radius: 9px;
    padding: 9px 18px; font-size: 13px; font-weight: 500;
    cursor: pointer; font-family: inherit;
  }
`
 
const mockData = [
  { id: 'NH001', supplier: 'Vựa Hoa Quả Miền Bắc', product: 'Vải thiều Lục Ngạn', qty: '50 kg', price: '85.000 ₫/kg', total: '4.250.000 ₫', date: '14/05/2026', status: 'Đã nhập' },
  { id: 'NH002', supplier: 'Trái Cây Miền Tây',    product: 'Xoài cát Hòa Lộc',   qty: '30 kg', price: '65.000 ₫/kg', total: '1.950.000 ₫', date: '13/05/2026', status: 'Đã nhập' },
  { id: 'NH003', supplier: 'Nhập khẩu Thăng Long', product: 'Nho Mẫu Đơn',        qty: '20 kg', price: '210.000 ₫/kg',total: '4.200.000 ₫', date: '12/05/2026', status: 'Chờ nhập' },
  { id: 'NH004', supplier: 'Vựa Hoa Quả Miền Bắc', product: 'Sầu riêng Ri6',      qty: '40 kg', price: '95.000 ₫/kg', total: '3.800.000 ₫', date: '11/05/2026', status: 'Nhập một phần' },
]
 
export default function NhapHangPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ supplier: '', product: '', qty: '', price: '', date: '', note: '' })
 
  const badgeClass = (s: string) =>
    s === 'Đã nhập' ? 'badge-done' : s === 'Chờ nhập' ? 'badge-pending' : 'badge-partial'
 
  return (
    <div>
      <style>{pageStyle}</style>
 
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#1a4d2e] mb-0.5">Nhập hàng</h1>
          <p className="text-slate-400 text-xs">Quản lý các phiếu nhập hàng từ nhà cung cấp</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}>
          <span style={{ fontSize: 16 }}>+</span> Tạo phiếu nhập
        </button>
      </div>
 
      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-[#1a4d2e] mb-4">Phiếu nhập hàng mới</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Nhà cung cấp</label>
              <input className="input-field" placeholder="Tên nhà cung cấp" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Sản phẩm</label>
              <input className="input-field" placeholder="Tên sản phẩm" value={form.product} onChange={e => setForm({...form, product: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Số lượng (kg)</label>
              <input className="input-field" type="number" placeholder="0" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Đơn giá (₫/kg)</label>
              <input className="input-field" type="number" placeholder="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Ngày nhập</label>
              <input className="input-field" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Ghi chú</label>
              <input className="input-field" placeholder="Ghi chú thêm..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary">Lưu phiếu nhập</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
          </div>
        </div>
      )}
 
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng phiếu nhập', value: '24', icon: '📋', color: '#4a9b5c' },
          { label: 'Đã nhập xong', value: '18', icon: '✅', color: '#16a34a' },
          { label: 'Chờ nhập', value: '4', icon: '🕒', color: '#d97706' },
          { label: 'Chi phí tháng này', value: '42.5M ₫', icon: '💰', color: '#1a4d2e' },
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
 
      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-[#1a4d2e]">Lịch sử nhập hàng</h3>
          <input className="input-field" style={{ width: 200 }} placeholder="🔍  Tìm kiếm..." />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
              {['Mã phiếu','Nhà cung cấp','Sản phẩm','Số lượng','Đơn giá','Tổng tiền','Ngày nhập','Trạng thái'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map(row => (
              <tr key={row.id} className="table-row border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.id}</td>
                <td className="px-5 py-3 font-medium text-[#1a4d2e]">{row.supplier}</td>
                <td className="px-5 py-3 text-slate-600">{row.product}</td>
                <td className="px-5 py-3 text-slate-600">{row.qty}</td>
                <td className="px-5 py-3 text-slate-600">{row.price}</td>
                <td className="px-5 py-3 font-bold text-[#1a4d2e]">{row.total}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{row.date}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${badgeClass(row.status)}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}