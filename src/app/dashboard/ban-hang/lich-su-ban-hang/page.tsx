'use client'
import React from 'react'
import { useSalesHistory } from '@/hooks/useSalesHistory'
import { useAuth } from '@/hooks/useAuth'

export default function SalesHistoryPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER'
  
  
  const { 
    invoices, loading, 
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    filterDate, setFilterDate,
    filterMonth, setFilterMonth,
    selectedInvoice, setSelectedInvoice 
  } = useSalesHistory()

  const guavaColors = { 
  primary: '#60A61F', 
  textDark: '#1a4d2e', 
  highlight: '#e65c00' 
}
  const floatingFruits = [
    { icon: '🍎', pos: 'top-[10%] right-[10%]', delay: '0s' },
    { icon: '🍇', pos: 'bottom-[20%] left-[5%]', delay: '1s' },
    { icon: '🥭', pos: 'top-[50%] right-[3%]', delay: '2.5s' },
  ]

  return (
    <div className="fade-up p-6 relative min-h-screen z-0 bg-gradient-to-br from-[#E1F0DA] via-[#FFF9E3] to-[#FDE8E9]">
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', color: guavaColors.textDark }} className="text-3xl mb-1">
              Lịch sử bán hàng
            </h1>
            <p className="text-slate-500 text-sm">
              {isManager ? 'Tra cứu và quản lý hóa đơn toàn hệ thống.' : 'Xem danh sách các đơn hàng bạn đã tạo trong hôm nay.'}
            </p>
          </div>

          {/* BỘ LỌC (CHỈ MANAGER MỚI THẤY) */}
          {isManager && (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-sm">
              <select 
                className="ft-input bg-slate-50 border-none text-sm font-bold text-slate-600 px-3 py-1.5 rounded-lg cursor-pointer"
                value={filterType} onChange={(e) => setFilterType(e.target.value as 'day' | 'month')}
              >
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
              </select>
              
              {filterType === 'day' ? (
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="ft-input bg-transparent border-none text-sm font-bold px-2 py-1 outline-none text-slate-700" />
              ) : (
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="ft-input bg-transparent border-none text-sm font-bold px-2 py-1 outline-none text-slate-700" />
              )}
            </div>
          )}
        </div>

        {/* BỘ LỌC TÌM KIẾM CHUNG */}
        <div className="mb-6 relative w-full md:w-1/3">
          <i className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"></i>
          <input 
            type="text" 
            placeholder="Mã hóa đơn, Tên KH..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ft-input w-full pl-10 pr-4 py-2.5 rounded-xl bg-white shadow-sm transition-all text-sm text-slate-700"
          />
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm ...">
          {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center font-bold text-slate-400">Đang tải dữ liệu...</div>}
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-4 px-6">Mã HĐ</th>
                  <th className="py-4 px-6">Thời gian</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  {isManager && <th className="py-4 px-6">Thu ngân</th>}
                  <th className="py-4 px-6 text-right">Tổng tiền</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {!loading && invoices.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">Không tìm thấy hóa đơn nào.</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold" style={{ color: guavaColors.textDark }}>{inv.invoiceCode}</td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {new Date(inv.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} <br/>
                        {new Date(inv.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700">{inv.customer?.name || 'Khách lẻ'}</td>
                      {isManager && <td className="py-4 px-6 text-slate-600">{inv.createdBy?.fullName || '-'}</td>}
                      <td className="py-4 px-6 text-right font-black" style={{ color: guavaColors.primary }}>
                        {inv.finalAmount.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                          {inv.status === 'PAID' ? 'Hoàn tất' : inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL XEM CHI TIẾT HÓA ĐƠN */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm fade-up">
            <div className="bg-white/80 rounded-2xl p-6">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Chi tiết {selectedInvoice.invoiceCode}</h3>
                <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 font-bold">✕</button>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between text-sm mb-4 pb-4">
                  <div>
                    <p className="text-slate-500 mb-1">Khách hàng</p>
                    <p className="font-bold text-slate-800">{selectedInvoice.customer?.name || 'Khách mua lẻ'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 mb-1">Phương thức</p>
                    <p className="font-bold text-slate-800">{selectedInvoice.paymentMethod}</p>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Danh sách sản phẩm</p>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                      <div>
                        <p className="font-bold text-sm text-slate-700">{item.product.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} {item.product.unit} x {item.unitPrice.toLocaleString('vi-VN')} ₫</p>
                      </div>
                      <p className="font-bold text-sm" style={{ color: guavaColors.textDark }}>
                        {item.subtotal.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4">
                  <div className="flex justify-between text-sm text-slate-500 mb-2">
                    <span>Tổng phụ</span>
                    <span>{selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500 mb-3">
                    <span>Giảm giá</span>
                    <span>- {selectedInvoice.discount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-slate-800">Thành tiền</span>
                    <span className="text-2xl font-black" style={{ color: guavaColors.primary }}>
                      {selectedInvoice.finalAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
