'use client'
import React, { useState } from 'react'

export default function TrangNhapHang() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const guavaColors = {
    primary: '#60A61F',      // Xanh ổi đậm
    textDark: '#1a4d2e',     // Xanh rêu đậm
    mainBg: '#f8faf7',       // <--- Đảm bảo màu nền chính (ví dụ: f8faf7 hoặc B4BD9A)
    cardBg1: '#CBEFAA',      // Xanh mạ non
    cardBg2: '#BEDE8A',      // Xanh ổi chín (Doanh thu)
    cardBg3: '#FEADBD',      // Hồng pastel (Hết hạn)
    cardBg4: '#F5EE9A',      // Vàng nhạt (Hết hàng)
    gridLine: '#ECEDDF',     // Nền lưới
  };

  const floatingFruits = [
    { icon: '🍎', pos: 'top-[5%] left-[8%]', delay: '0s' },
    { icon: '🍐', pos: 'top-[10%] right-[15%]', delay: '1s' },
    { icon: '🍒', pos: 'top-[22%] left-[45%]', delay: '1.9s' },
    { icon: '🍇', pos: 'top-[35%] right-[8%]', delay: '0.5s' },
    { icon: '🥭', pos: 'top-[45%] left-[5%]', delay: '2s' },
    { icon: '🍊', pos: 'top-[55%] left-[60%]', delay: '3.5s' },
    { icon: '🍌', pos: 'top-[65%] left-[25%]', delay: '2.7s' },
    { icon: '🍓', pos: 'top-[75%] right-[5%]', delay: '2.5s' },
    { icon: '🍈', pos: 'top-[82%] left-[10%]', delay: '1.5s' },
    { icon: '🥥', pos: 'top-[88%] right-[40%]', delay: '1.2s' },
    { icon: '🥝', pos: 'top-[95%] left-[50%]', delay: '3s' },
    { icon: '🍑', pos: 'top-[15%] left-[30%]', delay: '0.8s' },
  ];

  const mockData = [
    { id: 'NH001', supplier: 'Vựa Hoa Quả Miền Bắc', product: 'Vải thiều Lục Ngạn', qty: '50', unit: 'kg', price: '85.000', total: '4.250.000', date: '14/05/2026', status: 'Đã nhập' },
    { id: 'NH002', supplier: 'Trái Cây Miền Tây', product: 'Xoài cát Hòa Lộc', qty: '30', unit: 'kg', price: '65.000', total: '1.950.000', date: '13/05/2026', status: 'Đã nhập' },
    { id: 'NH003', supplier: 'Nhập khẩu Thăng Long', product: 'Nho Mẫu Đơn', qty: '20', unit: 'kg', price: '210.000', total: '4.200.000', date: '12/05/2026', status: 'Chờ nhập' },
    { id: 'NH004', supplier: 'Vựa Hoa Quả Miền Bắc', product: 'Sầu riêng Ri6', qty: '40', unit: 'kg', price: '95.000', total: '3.800.000', date: '11/05/2026', status: 'Nhập một phần' },
  ]

  const filteredData = mockData.filter(item => {
    const matchSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
    return matchSearch && matchStatus;
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Đã nhập': return <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold uppercase tracking-wider">Đã nhập</span>
      case 'Chờ nhập': return <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-md text-[11px] font-bold uppercase tracking-wider">Chờ nhập</span>
      case 'Nhập một phần': return <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold uppercase tracking-wider">Nhập một phần</span>
      default: return <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-[11px] font-bold uppercase tracking-wider">{status}</span>
    }
  }

  return (
    <div className="fade-up p-6 relative min-h-screen z-0 bg-transparent">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        
        .stat-card {
          border-radius: 14px; 
          padding: 16px; 
          transition: all 0.3s;
        }
        .stat-card:hover {
          box-shadow: 0 6px 20px rgba(96, 166, 31, 0.15);
          transform: translateY(-2px);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        
        .floating-fruit {
          position: absolute;
          animation: float 6s ease-in-out infinite;
          opacity: 0.45;
          font-size: 1.7rem; 
        }
      `}</style>

      {/* LỚP TRÁI CÂY NỀN */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {floatingFruits.map((fruit, index) => (
          <span key={index} className={`floating-fruit ${fruit.pos}`} style={{ animationDelay: fruit.delay }}>
            {fruit.icon}
          </span>
        ))}
      </div>

      <div className="relative z-10">
        
        {/* Header */}
        <div className="mb-8 text-center md:text-left bg-transparent rounded-2xl p-6 shadow-soft">
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: guavaColors.textDark }} className="text-4xl uppercase mb-1">
            NHẬP HÀNG
          </h1>
          <p className="text-slate-500 text-sm font-medium">Quản lý các phiếu nhập hàng từ nhà cung cấp</p>
        </div>

        {/* 4 Ô Thống kê hàng ngang */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'TỔNG PHIẾU NHẬP', value: '24', bgColor: guavaColors.cardBg1, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
            { label: 'ĐÃ NHẬP XONG', value: '18', bgColor: guavaColors.cardBg2, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: 'CHỜ NHẬP', value: '4', bgColor: guavaColors.cardBg4, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: 'CHI PHÍ THÁNG NÀY', value: '42.5M ₫', bgColor: guavaColors.cardBg3, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          ].map((stat, idx) => (
            <div key={idx} className="rounded-xl p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: stat.bgColor }}>
              <div>
                <p className="text-[11px] font-bold text-slate-700/60 mb-1 tracking-wider">{stat.label}</p>
                <p style={{ color: guavaColors.textDark }} className="text-2xl font-black">{stat.value}</p>
              </div>
              <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center text-slate-800 shadow-sm">
                <svg className="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">{stat.icon}</svg>
              </div>
            </div>
          ))}
        </div>
        
        {/* 4. BẢNG DỮ LIỆU CHÍNH (Hòa trộn màu nền trùng ngoài) */}
        <div className="bg-transparent rounded-2xl p-6 border border-slate-200/60 shadow-sm mt-8">
            {/* Thanh công cụ thông minh */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 style={{ color: guavaColors.textDark }} className="text-lg font-bold">Lịch sử nhập hàng</h2>
              <div className="flex gap-3 w-full sm:w-auto">
                {/* Lọc trạng thái */}
                <select 
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#60A61F] text-slate-600 bg-white cursor-pointer outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  <option value="Đã nhập">Đã nhập</option>
                  <option value="Chờ nhập">Chờ nhập</option>
                  <option value="Nhập một phần">Nhập một phần</option>
                </select>
                {/* Thanh tìm kiếm */}
                <div className="relative flex-1 sm:flex-none">
                  <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Tìm mã phiếu, sản phẩm..." 
                    className="pl-9 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#60A61F] focus:ring-1 focus:ring-[#60A61F] transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bảng chi tiết */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-slate-500 uppercase bg-transparent border-b border-slate-100 font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Mã Phiếu</th>
                    <th className="px-6 py-4">Nhà cung cấp / Sản phẩm</th>
                    <th className="px-6 py-4 text-right">Số lượng</th>
                    <th className="px-6 py-4 text-right">Đơn giá</th>
                    <th className="px-6 py-4 text-right">Tổng tiền</th>
                    <th className="px-6 py-4 text-center">Ngày nhập</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={index} className="border-b border-slate-50 hover:bg-white transition-colors group">
                      <td className="px-6 py-4">
                        <span style={{ color: guavaColors.primary }} className="font-bold cursor-pointer hover:underline">{row.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{row.product}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{row.supplier}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-700">{row.qty}</span> <span className="text-slate-400 text-xs">{row.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">{row.price} <span className="text-[10px]">₫</span></td>
                      <td className="px-6 py-4 text-right font-black" style={{ color: guavaColors.textDark }}>{row.total} <span className="text-[10px]">₫</span></td>
                      <td className="px-6 py-4 text-center text-slate-500 text-xs font-medium">{row.date}</td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(row.status)}</td>
                      <td className="px-6 py-4 text-center space-x-2 relative">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-colors" title="Xem chi tiết">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors" title="Xóa phiếu">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <p className="text-slate-400 mb-2">Không tìm thấy phiếu nhập nào phù hợp.</p>
                        <span className="text-4xl opacity-20">📦</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
        
      </div>
    </div>
  )
}