'use client'
import React from 'react'
import { useCustomers } from '@/hooks/useCustomers'

export default function CustomersPage() {
  const { customers, loading, searchQuery, setSearchQuery } = useCustomers()

  const guavaColors = { primary: '#60A61F', textDark: '#1a4d2e', gridLine: '#ECEDDF' };
  const floatingFruits = [
    { icon: '🍉', pos: 'top-[10%] left-[8%]', delay: '0s' },
    { icon: '🍓', pos: 'top-[25%] right-[10%]', delay: '1s' },
    { icon: '🥭', pos: 'top-[60%] left-[5%]', delay: '2s' },
    { icon: '🍈', pos: 'bottom-[10%] right-[15%]', delay: '1.5s' },
  ];

  return (
    <div className="fade-up p-6 relative min-h-full z-0 bg-transparent">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(5deg); } }
        .floating-fruit { position: absolute; animation: float 6s ease-in-out infinite; opacity: 0.35; font-size: 2rem; }
        .ft-input:focus { border-color: ${guavaColors.primary}; box-shadow: 0 0 0 3px rgba(96, 166, 31, 0.1); outline: none; }
      `}</style>

      {/* Lớp nền trái cây */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {floatingFruits.map((fruit, idx) => (
          <span key={idx} className={`floating-fruit ${fruit.pos}`} style={{ animationDelay: fruit.delay }}>{fruit.icon}</span>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: guavaColors.textDark }} className="text-3xl mb-1">
            Khách hàng
          </h1>
          <p className="text-slate-500 text-sm">Quản lý thông tin và điểm thưởng khách hàng.</p>
        </div>

        {/* BỘ LỌC TÌM KIẾM */}
        <div className="mb-6 relative w-full md:w-1/3">
          <i className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo Tên, SĐT, Mã KH..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ft-input w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm transition-all text-sm"
          />
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-4 px-6">Mã KH</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Liên hệ</th>
                  <th className="py-4 px-6">Địa chỉ</th>
                  <th className="py-4 px-6 text-right">Tổng chi tiêu</th>
                  <th className="py-4 px-6 text-center">Điểm</th>
                  <th className="py-4 px-6">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">Đang tải dữ liệu...</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">Không tìm thấy khách hàng nào.</td></tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="border-b border-dashed border-slate-100 hover:bg-slate-50/50 transition-colors last:border-0">
                      <td className="py-4 px-6 font-medium text-slate-500">{c.code}</td>
                      <td className="py-4 px-6 font-bold" style={{ color: guavaColors.textDark }}>{c.name}</td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-slate-700">{c.phone}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-600 truncate max-w-[200px]" title={c.address}>{c.address}</td>
                      <td className="py-4 px-6 text-right font-black" style={{ color: guavaColors.textDark }}>
                        {c.totalSpent.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-orange-500 bg-orange-50/30">
                        {c.points}
                      </td>
                      <td className="py-4 px-6 text-slate-500">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
