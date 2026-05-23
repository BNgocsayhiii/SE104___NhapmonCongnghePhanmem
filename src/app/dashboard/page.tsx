'use client'
import React, { useMemo } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export default function DashboardOverview() {
  const { stats, loading } = useDashboardStats()

  const guavaColors = {
    primary: '#60A61F',
    textDark: '#1a4d2e',
    mainBg: '#f8faf7',
    cardBg1: '#CBEFAA',
    cardBgProfit: '#C8D77C',
    cardBg2: '#FBA685',
    cardBg3: '#F5EE9A',
    gridLine: '#ECEDDF',
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
  ];

  const statCards = stats
  ? [
      { label: stats.revenue.label, value: stats.revenue.formatted, icon: '📈', bgColor: guavaColors.cardBg1 },
      { label: stats.profit.label, value: stats.profit.formatted, icon: '💵', bgColor: guavaColors.cardBgProfit },
      { label: stats.expiringSoon.label, value: stats.expiringSoon.formatted, icon: '⏳', bgColor: guavaColors.cardBg2 },
      { label: stats.lowStock.label, value: stats.lowStock.formatted, icon: '⚠️', bgColor: guavaColors.cardBg3 },
    ]
  : [
      { label: 'Doanh thu hôm nay', value: '—', icon: '📈', bgColor: guavaColors.cardBg1 },
      { label: 'Lợi nhuận hôm nay', value: '—', icon: '💵', bgColor: guavaColors.cardBgProfit },
      { label: 'Sắp hết hạn', value: '—', icon: '⏳', bgColor: guavaColors.cardBg2 },
      { label: 'Sắp hết hàng', value: '—', icon: '⚠️', bgColor: guavaColors.cardBg3 },
    ]

  // --- LOGIC TÍNH TOÁN BIỂU ĐỒ ĐỘNG ---
  const { chartPoints, chartMax, pathD, yAxisLabels } = useMemo(() => {
    if (!stats?.chartData || stats.chartData.length === 0) {
      return { chartPoints: [], chartMax: 4000000, pathD: '', yAxisLabels: [] };
    }
    
    // Tìm mức lợi nhuận cao nhất trong tháng để làm trần biểu đồ
    const maxVal = Math.max(...stats.chartData.map(d => d.value));
    // Tự động làm tròn số trần (Ví dụ: 3.2M -> Làm tròn lên 4M để biểu đồ đẹp)
    let topAxis = Math.ceil((maxVal || 1) / 1000000) * 1000000; 
    if (topAxis === 0) topAxis = 4000000; // Mặc định nếu không có data

    // Tạo nhãn trục Y (Chia làm 4 vạch)
    const yAxisLabels = [topAxis, topAxis * 0.75, topAxis * 0.5, topAxis * 0.25, 0].map(val => 
      val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val.toLocaleString()} ₫`
    );

    // Tính toạ độ các điểm SVG
    const chartPoints = stats.chartData.map((d, i) => {
      const x = i * 33.33; // 4 điểm: 0, 33.33, 66.66, 100
      // Tính % chiều cao (100 là đáy, 0 là đỉnh). Trừ hao 5% để không đụng nóc.
      let y = 100 - (d.value / topAxis * 95); 
      if (y > 100) y = 100;

      // Format số liệu hiển thị trên điểm
      const valStr = d.value >= 1000000 ? `${(d.value / 1000000).toFixed(1)}M` : `${(d.value / 1000).toFixed(0)}K`;
      
      return { x, y, valStr, raw: d.value };
    });

    const pathD = `M 0,${chartPoints[0].y} L 33.33,${chartPoints[1].y} L 66.66,${chartPoints[2].y} L 100,${chartPoints[3].y}`;

    return { chartPoints, chartMax: topAxis, pathD, yAxisLabels };
  }, [stats]);


  return (
    <div className="fade-up p-6 relative min-h-full z-0 bg-transparent">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        .stat-card { border-radius: 14px; padding: 16px; transition: all 0.3s; }
        .stat-card:hover { box-shadow: 0 6px 20px rgba(96, 166, 31, 0.15); transform: translateY(-2px); }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        .floating-fruit { position: absolute; animation: float 6s ease-in-out infinite; opacity: 0.45; font-size: 1.7rem; }
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
            <div key={idx} className="stat-card flex items-center justify-between shadow-sm" style={{ backgroundColor: item.bgColor }}>
              <div>
                <p className="text-xs font-bold text-slate-700/70 uppercase tracking-wider mb-1">{item.label}</p>
                <p style={{ color: guavaColors.textDark }} className="text-xl font-black whitespace-nowrap">
                  {loading ? '...' : item.value}
                </p>
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
            <div className="bg-transparent rounded-2xl p-6 border border-slate-200/60 shadow-sm h-full relative">
              
              {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-[#60A61F]">Đang tải dữ liệu...</div>}

              <div className="flex justify-between items-center mb-8">
                <h3 style={{ color: guavaColors.textDark }} className="font-bold text-xl tracking-tight">LỢI NHUẬN 4 TUẦN QUA</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
                </p>
              </div>
              
              <div className="h-[280px] w-full relative flex items-end">
                {/* TRỤC Y */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-10 w-[90px] pr-4 text-right">
                  {yAxisLabels.map((lbl, idx) => <span key={idx}>{lbl}</span>)}
                </div>
                
                {/* VÙNG BIỂU ĐỒ */}
                <div className="ml-[90px] w-full h-full relative pr-8">
                  <div className="w-full h-[calc(100%-40px)] border-b-2 border-l-2 border-slate-200 relative flex items-end">
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute w-full h-full border-t border-dashed top-0"></div>
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute w-full h-1/2 border-t border-dashed top-1/2"></div>
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute h-full border-l border-dashed left-[33.33%]"></div>
                      <div style={{ borderColor: guavaColors.gridLine }} className="absolute h-full border-l border-dashed left-[66.66%]"></div>

                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                          {pathD && <path d={pathD} fill="none" stroke={guavaColors.primary} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />}
                      </svg>

                      {/* Các điểm mốc */}
                      {chartPoints.map((pt, i) => (
                        <div key={i} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                          <span style={{ color: guavaColors.textDark }} className="text-[11px] font-black mb-1 whitespace-nowrap">
                            {pt.valStr}
                          </span>
                          <div style={{ borderColor: guavaColors.primary }} className="w-2.5 h-2.5 bg-white border-2 rounded-full shadow-sm"></div>
                        </div>
                      ))}
                  </div>

                  {/* TRỤC X */}
                  <div className="w-full pt-4 text-[11px] font-bold text-slate-500 relative h-8">
                    {stats?.chartData?.map((d, idx) => (
                      <span key={idx} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${idx * 33.33}%` }}>
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT BEST SELLER (Chiếm 1/3) */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col h-full relative">
            {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20"></div>}

            <h3 style={{ color: guavaColors.textDark }} className="font-bold text-xl mb-6 italic">🏆 Best Seller</h3>
            
            <div className="space-y-4 flex-1">
              {stats?.bestSellers?.length === 0 && !loading && (
                <p className="text-center text-slate-400 text-sm mt-10">Chưa có dữ liệu bán hàng</p>
              )}

              {stats?.bestSellers?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer pb-2 border-b border-dashed border-slate-100 last:border-0 last:pb-0 hover:bg-slate-50 rounded-lg p-1.5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {item.img}
                    </div>
                    <div>
                      <p style={{ color: guavaColors.textDark }} className="text-[13px] font-bold leading-tight mb-0.5 line-clamp-1 max-w-[120px]" title={item.name}>
                        {item.name}
                      </p>
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

        <div className="mt-10 text-center opacity-90 relative z-20">
           <p className="text-[#60A61F] font-bold italic text-[15px] tracking-wide">
              "FruiTrack — Tươi ngon mỗi ngày, quản lý dễ dàng trong tầm tay"
           </p>
        </div>

      </div>
    </div>
  )
}