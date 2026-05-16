'use client'
import React from 'react'

export default function DashboardOverview() {
  return (
    <div className="fade-up">
      {/* Google Fonts & Animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        
        .stat-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s;
        }
        .stat-card:hover {
          border-color: #4a9b5c;
          box-shadow: 0 4px 12px rgba(74, 155, 92, 0.08);
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl text-[#1a4d2e] mb-1">
          Tổng quan
        </h1>
        <p className="text-slate-500 text-sm">Cập nhật tình hình kinh doanh hôm nay</p>
      </div>

      {/* Grid Thống kê nhanh (8 ô như trong ảnh mẫu) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Doanh thu hôm nay', value: '0 ₫', icon: '📈', color: '#4a9b5c' },
          { label: 'Hóa đơn POS hôm nay', value: '0', icon: '🧾', color: '#4a9b5c' },
          { label: 'Lô sắp hết hạn (≤ 3 ngày)', value: '0', icon: '⏳', color: '#facc15' },
          { label: 'Thiệt hại hao hụt', value: '0 ₫', icon: '🗑️', color: '#ef4444' },
          { label: 'Đơn web hôm nay', value: '0', icon: '🛒', color: '#4a9b5c' },
          { label: 'Đơn chờ xử lý', value: '2', icon: '🕒', color: '#3b82f6' },
          { label: 'Sắp hết tồn kho', value: '4', icon: '⚠️', color: '#f97316' },
          { label: 'Tổng doanh thu', value: '3.481.000 ₫', icon: '👥', color: '#1a4d2e' },
        ].map((item, idx) => (
          <div key={idx} className="stat-card flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-xl font-bold text-[#1a4d2e]">{item.value}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: `${item.color}10`, color: item.color }}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu (Cột trái - Rộng 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#1a4d2e]">Doanh thu 14 ngày qua</h3>
            <div className="text-[10px] text-slate-400 font-mono">03/05/2026 - 15/05/2026</div>
          </div>
          <div className="h-[250px] w-full relative flex items-end">
            {/* Trục Y */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-300">
              <span>0.004k</span><span>0.003k</span><span>0.002k</span><span>0.001k</span><span>0k</span>
            </div>
            {/* Đường lưới & Biểu đồ */}
            <div className="ml-10 w-full h-full border-b border-slate-100 relative flex items-end">
              <div className="absolute w-full h-full border-t border-dashed border-slate-100 top-0"></div>
              <div className="absolute w-full h-1/2 border-t border-dashed border-slate-100 top-1/2"></div>
              {/* Baseline */}
              <div className="w-full h-1 bg-[#4a9b5c] rounded-full opacity-30"></div>
            </div>
          </div>
        </div>

        {/* Sản phẩm bán chạy (Cột phải - Rộng 1/3) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-[#1a4d2e] mb-6">Sản phẩm bán chạy</h3>
          <div className="space-y-5">
            {[
              { name: 'Nho mẫu đơn', cat: 'Trái cây nhập khẩu', sold: 3, img: '🍇' },
              { name: 'Sầu riêng Ri6', cat: 'Trái cây nhiệt đới', sold: 4, img: '🍈' },
              { name: 'Táo Envy', cat: 'Trái cây nhập khẩu', sold: 3, img: '🍎' },
              { name: 'Bưởi da xanh', cat: 'Trái cây có múi', sold: 6, img: '🍐' },
              { name: 'Xoài cát Hòa Lộc', cat: 'Trái cây nhiệt đới', sold: 4, img: '🥭' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f8faf7] rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {item.img}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a4d2e] leading-none mb-1">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.cat}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#4a9b5c]">{item.sold}</p>
                  <p className="text-[9px] text-slate-400 uppercase">đã bán</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Đơn hàng gần đây */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-[#1a4d2e] mb-6">Đơn hàng gần đây</h3>
          <div className="space-y-4">
            {[
              { id: '#DH240511', customer: 'Cô Hồng', date: '23/04/2026', total: '165.000 ₫', status: 'Chờ xử lý' },
              { id: '#DH240510', customer: 'Khách lẻ', date: '23/04/2026', total: '96.000 ₫', status: 'Chờ xử lý' },
              { id: '#DH240509', customer: 'Anh Minh', date: '22/04/2026', total: '330.000 ₫', status: 'Hoàn thành' },
            ].map((order, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-bold text-[#1a4d2e]">{order.id}</p>
                  <p className="text-[11px] text-slate-400">{order.customer} • {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1a4d2e] mb-1">{order.total}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${order.status === 'Chờ xử lý' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sắp hết hàng */}
        <div className="bg-[#fffcfb] rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center gap-2 mb-6 text-orange-600">
            <span className="text-lg">⚠️</span>
            <h3 className="font-bold">Sắp hết hàng</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Vải thiều Lục Ngạn', stock: '5 kg', color: '#ef4444' },
              { name: 'Sầu riêng Ri6', stock: '6 kg', color: '#f97316' },
              { name: 'Nho mẫu đơn', stock: '8 kg', color: '#f97316' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white border border-orange-50 rounded-xl">
                <p className="text-sm font-medium text-[#1a4d2e]">{item.name}</p>
                <p className="text-sm font-bold" style={{ color: item.color }}>{item.stock}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}