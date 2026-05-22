'use client'
import React from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export default function DashboardOverview() {
  const { stats, loading } = useDashboardStats()

  const guavaColors = {
    primary: '#60A61F',      // Xanh ổi đậm
    textDark: '#1a4d2e',     // Xanh rêu đậm
    mainBg: '#f8faf7',       // Nền sáng đồng bộ toàn hệ thống
    cardBg1: '#CBEFAA',      // Xanh mạ non (Doanh thu)
    cardBgProfit: '#C8D77C', // Đã đổi: Hồng dâu (Lợi nhuận)
    cardBg2: '#FBA685',      // Đã đổi: Cam nhạt (Sắp hết hạn)
    cardBg3: '#F5EE9A',      // Vàng nhạt (Sắp hết hàng)
    gridLine: '#ECEDDF',     // Nền lưới
  };

  const floatingFruits = [
    { icon: '🍎', pos: 'top-[8%] left-[5%]', delay: '0s' },
    { icon: '🍐', pos: 'top-[15%] right-[12%]', delay: '1s' },
    { icon: '🍒', pos: 'top-[28%] left-[40%]', delay: '1.9s' },
    { icon: '🍇', pos: 'top-[40%] right-[10%]', delay: '0.5s' },
    { icon: '🥭', pos: 'top-[50%] left-[8%]', delay: '2s' },
    { icon: '🍊', pos: 'top-[62%] left-[62%]', delay: '3.5s' },
    { icon: '🍌', pos: 'top-[70%] left-[30%]', delay: '2.7s' },
    { icon: '🍓', pos: 'top-[82%] right-[8%]', delay: '2.5s' },
    { icon: '🍈', pos: 'top-[88%] left-[15%]', delay: '1.5s' },
    { icon: '🥥', pos: 'top-[92%] right-[45%]', delay: '1.2s' },
    { icon: '🥝', pos: 'top-[96%] left-[55%]', delay: '3s' },
    { icon: '🍑', pos: 'top-[20%] left-[25%]', delay: '0.8s' },
  ];

  const statCards = stats
  ? [
      { label: stats.revenue.label,      value: stats.revenue.formatted,     icon: '📈', bgColor: guavaColors.cardBg1      },
      { label: stats.profit.label,       value: stats.profit.formatted,       icon: '💵', bgColor: guavaColors.cardBgProfit },
      { label: stats.expiringSoon.label, value: stats.expiringSoon.formatted, icon: '⏳', bgColor: guavaColors.cardBg2      },
      { label: stats.lowStock.label,     value: stats.lowStock.formatted,     icon: '⚠️', bgColor: guavaColors.cardBg3      },
    ]
  : [
      { label: 'Doanh thu hôm nay', value: '—', icon: '📈', bgColor: guavaColors.cardBg1      },
      { label: 'Lợi nhuận hôm nay', value: '—', icon: '💵', bgColor: guavaColors.cardBgProfit },
      { label: 'Sắp hết hạn',       value: '—', icon: '⏳', bgColor: guavaColors.cardBg2      },
      { label: 'Sắp hết hàng',      value: '—', icon: '⚠️', bgColor: guavaColors.cardBg3      },
    ]

  return (
    <div className="fade-up p-6 relative min-h-full z-0 bg-transparent">
      
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
        <div className="mb-8 text-center md:text-left">
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: guavaColors.textDark }} className="text-4xl uppercase mb-1">
            TỔNG QUAN
          </h1>
          <p className="text-slate-500 text-sm font-medium">Phân tích dữ liệu kinh doanh định kỳ</p>
        </div>

        {/* 4 Ô Thống kê hàng ngang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((item, idx) => (
            <div key={idx} className="stat-card flex items-center justify-between border-none shadow-sm" style={{ backgroundColor: item.bgColor }}>
              <div>
                <p className="text-xs font-bold text-slate-700/70 uppercase tracking-wider mb-1">{item.label}</p>
                <p style={{ color: guavaColors.textDark }} className="text-xl font-black whitespace-nowrap">{item.value}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/50 shadow-sm flex-shrink-0 ml-2">
                {item.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Hàng 2: Biểu đồ & Best Seller */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT BIỂU ĐỒ (Chiếm 2/3) */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-transparent rounded-2xl p-6 border border-slate-200/60 shadow-sm h-full">
              <div className="flex justify-between items-center mb-8">
                {/* Đã sửa tên biểu đồ thành "Doanh thu tháng" và bỏ viết hoa toàn bộ */}
                <h3 style={{ color: guavaColors.textDark }} className="font-bold text-xl tracking-tight">LỢI NHUẬN THEO THÁNG</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tháng 05/2026 • 4 Tuần</p>
              </div>
              
              <div className="h-[280px] w-full relative flex items-end">
                {/* TRỤC Y */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-10 w-[90px] pr-4 text-right">
                  <span>4.000.000 ₫</span>
                  <span>3.000.000 ₫</span>
                  <span>2.000.000 ₫</span>
                  <span>1.000.000 ₫</span>
                  <span>0 ₫</span>
                </div>
                
                {/* VÙNG BIỂU ĐỒ */}
                <div className="ml-[90px] w-full h-full relative pr-8">
                  <div className="w-full h-[calc(100%-40px)] border-b-2 border-l-2 border-slate-200 relative flex items-end">
                      {/* Lưới ngang */}
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute w-full h-full border-t border-dashed top-0"></div>
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute w-full h-1/2 border-t border-dashed top-1/2"></div>
                      
                      {/* Lưới dọc theo chu kỳ 4 tuần */}
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute h-full border-l border-dashed left-[33.33%]"></div>
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute h-full border-l border-dashed left-[66.66%]"></div>

                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                          <path d="M 0,85 L 33.33,60 L 66.66,72 L 100,35" fill="none" stroke={guavaColors.primary} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>

                      {/* Các điểm mốc và Nhãn số liệu bằng HTML */}
                      {[
                        {x: 0, y: 85, val: '0.8M'},
                        {x: 33.33, y: 60, val: '1.6M'},
                        {x: 66.66, y: 72, val: '1.2M'},
                        {x: 100, y: 35, val: '2.8M'}
                      ].map((pt, i) => (
                        <div key={i} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                          <span style={{ color: guavaColors.textDark }} className="text-[11px] font-black mb-1 whitespace-nowrap">
                            {pt.val}
                          </span>
                          <div style={{ borderColor: guavaColors.primary }} className="w-2.5 h-2.5 bg-white border-2 rounded-full shadow-sm"></div>
                        </div>
                      ))}
                  </div>

                  {/* TRỤC X */}
                  <div className="w-full pt-4 text-[11px] font-bold text-slate-500 relative h-8">
                      <span className="absolute left-[0%] -translate-x-1/2 whitespace-nowrap">Tuần 1</span>
                      <span className="absolute left-[33.33%] -translate-x-1/2 whitespace-nowrap">Tuần 2</span>
                      <span className="absolute left-[66.66%] -translate-x-1/2 whitespace-nowrap">Tuần 3</span>
                      <span className="absolute left-[100%] -translate-x-1/2 whitespace-nowrap">Tuần 4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT BEST SELLER (Chiếm 1/3) */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col h-full">
            <h3 style={{ color: guavaColors.textDark }} className="font-bold text-xl mb-6 italic">🏆 Best Seller</h3>
            <div className="space-y-4 flex-1">
              {[
                { name: 'Nho mẫu đơn', cat: 'Nhập khẩu', sold: 3, img: '🍇' },
                { name: 'Sầu riêng Ri6', cat: 'Nhiệt đới', sold: 4, img: '🍈' },
                { name: 'Táo Envy', cat: 'Nhập khẩu', sold: 3, img: '🍎' },
                { name: 'Bưởi da xanh', cat: 'Có múi', sold: 6, img: '🍐' },
                { name: 'Xoài cát Hòa Lộc', cat: 'Nhiệt đới', sold: 4, img: '🥭' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer pb-2 border-b border-dashed border-slate-100 last:border-0 last:pb-0 hover:bg-slate-50 rounded-lg p-1.5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {item.img}
                    </div>
                    <div>
                      <p style={{ color: guavaColors.textDark }} className="text-[13px] font-bold leading-tight mb-0.5">{item.name}</p>
                      <p className="text-[10px] font-medium text-slate-400">{item.cat}</p>
                    </div>
                  </div>
                  <div className="text-right pr-2">
                    <p style={{ color: guavaColors.primary }} className="text-base font-black">{item.sold}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">đã bán</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CÂU SLOGAN NẰM DƯỚI CÙNG BAO TRỌN TOÀN BỘ GIAO DIỆN */}
        <div className="mt-10 text-center opacity-90 relative z-20">
           <p className="text-[#60A61F] font-bold italic text-[15px] tracking-wide">
              "FruiTrack — Tươi ngon mỗi ngày, quản lý dễ dàng trong tầm tay"
           </p>
        </div>

      </div>
    </div>
  )
}