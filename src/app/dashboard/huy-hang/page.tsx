'use client'
import React, { useState } from 'react'
 
const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
  .input-field { border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; width:100%; outline:none; transition:border .15s; font-family:inherit; }
  .input-field:focus { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.08); }
  .btn-danger { background:#ef4444; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
  .btn-danger:hover { background:#dc2626; }
  .btn-ghost { background:transparent; color:#64748b; border:1px solid #e2e8f0; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; }
  .table-row:hover { background:#fff5f5; }
`
 
const reasons = ['Hết hạn sử dụng', 'Hư hỏng / dập nát', 'Nấm mốc', 'Không đạt chất lượng', 'Khác']
 
const mockData = [
  { id: 'HH001', loHang: 'LH001', product: 'Vải thiều Lục Ngạn', qty: 2, unit: 'kg', reason: 'Hết hạn sử dụng', loss: 220000, date: '15/05/2026', staff: 'admin' },
  { id: 'HH002', loHang: 'LH004', product: 'Sầu riêng Ri6',       qty: 1, unit: 'kg', reason: 'Hư hỏng / dập nát', loss: 130000, date: '14/05/2026', staff: 'admin' },
  { id: 'HH003', loHang: 'LH002', product: 'Xoài cát Hòa Lộc',   qty: 3, unit: 'kg', reason: 'Nấm mốc',           loss: 270000, date: '13/05/2026', staff: 'admin' },
]
 
export default function HuyHangPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ loHang: '', product: '', qty: '', reason: reasons[0], note: '' })
 
  const totalLoss = mockData.reduce((s, r) => s + r.loss, 0)
 
  return (
    <div>
      <style>{pageStyle}</style>
 
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#1a4d2e] mb-0.5">Hủy hàng</h1>
          <p className="text-slate-400 text-xs">Ghi nhận hàng hỏng, hết hạn, không đủ chất lượng</p>
        </div>
        <button className="btn-danger flex items-center gap-2" onClick={() => setShowForm(true)}>
          <span>🗑️</span> Tạo phiếu hủy
        </button>
      </div>
 
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Phiếu hủy tháng này', value: '3',            icon: '📋', color: '#ef4444' },
          { label: 'Tổng kg đã hủy',      value: '6 kg',         icon: '⚖️', color: '#f97316' },
          { label: 'Thiệt hại tháng này', value: '620.000 ₫',    icon: '💸', color: '#ef4444' },
          { label: 'Lý do phổ biến',      value: 'Hết hạn',      icon: '⏳', color: '#d97706' },
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
 
      {/* Form */}
      {showForm && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🗑️</span>
            <h3 className="font-bold text-red-700">Phiếu hủy hàng mới</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Mã lô hàng</label>
              <input className="input-field" placeholder="VD: LH001" value={form.loHang} onChange={e => setForm({...form, loHang: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Sản phẩm</label>
              <input className="input-field" placeholder="Tên sản phẩm" value={form.product} onChange={e => setForm({...form, product: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Số lượng hủy (kg)</label>
              <input className="input-field" type="number" placeholder="0" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Lý do hủy</label>
              <select className="input-field" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}>
                {reasons.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">Ghi chú</label>
              <input className="input-field" placeholder="Mô tả thêm về tình trạng hàng..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-danger">Xác nhận hủy hàng</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Hủy bỏ</button>
          </div>
        </div>
      )}
 
      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-[#1a4d2e]">Lịch sử hủy hàng</h3>
          <p className="text-sm text-red-500 font-bold">Tổng thiệt hại: {totalLoss.toLocaleString()} ₫</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
              {['Mã phiếu','Lô hàng','Sản phẩm','Số lượng','Lý do','Thiệt hại','Ngày hủy','Người thực hiện'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map(row => (
              <tr key={row.id} className="table-row border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.id}</td>
                <td className="px-5 py-3 font-mono text-xs text-blue-500">{row.loHang}</td>
                <td className="px-5 py-3 font-medium text-[#1a4d2e]">{row.product}</td>
                <td className="px-5 py-3 text-slate-600">{row.qty} {row.unit}</td>
                <td className="px-5 py-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">{row.reason}</span>
                </td>
                <td className="px-5 py-3 font-bold text-red-500">-{row.loss.toLocaleString()} ₫</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{row.date}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{row.staff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}