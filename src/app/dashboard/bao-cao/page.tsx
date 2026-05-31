'use client'
import React from 'react'
import { useReports, TimeRange } from '@/hooks/useReports'

export default function ReportsPage() {
  const { data, loading, error, filter, setFilter } = useReports()
  const timeRange = filter.range

  const guavaColors = {
    primary: '#60A61F',
    textDark: '#1a4d2e',
    cardBg1: '#CBEFAA',
    cardBgProfit: '#C8D77C',
    cardBgWaste: '#FBA685',
    cardBgStock: '#F5EE9A',
  }

  const wasteReasonLabels: Record<string, string> = {
    EXPIRED: 'Hết hạn / Thối hỏng',
    DAMAGED: 'Hư hỏng / Dập nát do vận chuyển',
    BIOLOGICAL: 'Hao hụt sinh học (Bay hơi nước)',
    PROMOTION: 'Hàng cắt ra làm Sampling (Dùng thử)',
    OTHER: 'Lý do khác'
  }

  const timeTabs: { id: TimeRange; label: string }[] = [
    { id: 'day', label: 'Theo ngày' },
    { id: 'month', label: 'Theo tháng' },
    { id: 'quarter', label: 'Theo quý' },
    { id: 'year', label: 'Theo năm' },
  ]

  const floatingFruits = [
    { icon: '🍍', pos: 'top-[12%] left-[4%]', delay: '0s' },
    { icon: '🍒', pos: 'top-[35%] right-[8%]', delay: '1.5s' },
    { icon: '🥝', pos: 'bottom-[15%] left-[10%]', delay: '2.2s' },
  ]

  const maxChannel = Math.max(...(data?.channels.map(c => c.value) || [1]))
  const maxPayment = Math.max(...(data?.payments.map(p => p.value) || [1]))
  const totalWaste = data?.summary.totalWasteCost || 1
  const activeLabel = (() => {
    if (filter.range === 'day') return filter.date ? new Date(`${filter.date}T00:00:00`).toLocaleDateString('vi-VN') : 'Ngày được chọn'
    if (filter.range === 'month') {
      const [year, month] = filter.month.split('-')
      return year && month ? `Tháng ${Number(month)}/${year}` : 'Tháng được chọn'
    }
    if (filter.range === 'quarter') return `Quý ${filter.quarter}/${filter.year}`
    return `Năm ${filter.year}`
  })()

  const updateFilter = (next: Partial<typeof filter>) => {
    setFilter(current => ({ ...current, ...next }))
  }

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const shiftPeriod = (direction: -1 | 1) => {
    setFilter(current => {
      if (current.range === 'day') {
        const date = current.date ? new Date(`${current.date}T00:00:00`) : new Date()
        date.setDate(date.getDate() + direction)
        return { ...current, date: toDateInputValue(date) }
      }

      if (current.range === 'month') {
        const [year, month] = current.month ? current.month.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
        const date = new Date(year, month - 1 + direction, 1)
        return { ...current, month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` }
      }

      if (current.range === 'quarter') {
        const nextQuarter = current.quarter + direction
        if (nextQuarter < 1) return { ...current, quarter: 4, year: current.year - 1 }
        if (nextQuarter > 4) return { ...current, quarter: 1, year: current.year + 1 }
        return { ...current, quarter: nextQuarter }
      }

      return { ...current, year: current.year + direction }
    })
  }

  return (
    <div className="fade-up p-6 relative min-h-full z-0 bg-transparent">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(5deg); } }
        .floating-fruit { position: absolute; animation: float 6s ease-in-out infinite; opacity: 0.35; font-size: 2rem; }
      `}</style>

      {/* Lớp trái cây nền */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {floatingFruits.map((fruit, index) => (
          <span key={index} className={`floating-fruit ${fruit.pos}`} style={{ animationDelay: fruit.delay }}>
            {fruit.icon}
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* HEADER & TIME FILTERS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', color: guavaColors.textDark }} className="text-4xl uppercase mb-1">
              BÁO CÁO KINH DOANH
            </h1>
            <p className="text-slate-500 text-sm font-medium">Thống kê dữ liệu cửa hàng chuyên sâu</p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white/85 p-2 shadow-sm backdrop-blur-md">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {timeTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => updateFilter({ range: tab.id })}
                  className={`px-3 py-2 text-sm font-bold rounded-xl transition-all ${
                    timeRange === tab.id
                      ? 'bg-[#60A61F] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[40px_minmax(190px,1fr)_40px] items-center gap-2">
              <button
                type="button"
                onClick={() => shiftPeriod(-1)}
                className="h-10 rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-600 hover:bg-slate-50"
              >
                ‹
              </button>

              {filter.range === 'day' && (
                <input
                  type="date"
                  value={filter.date}
                  onChange={(event) => {
                    if (event.target.value) updateFilter({ date: event.target.value })
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#60A61F]"
                />
              )}

              {filter.range === 'month' && (
                <input
                  type="month"
                  value={filter.month}
                  onChange={(event) => {
                    if (event.target.value) updateFilter({ month: event.target.value })
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#60A61F]"
                />
              )}

              {filter.range === 'quarter' && (
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <select
                    value={filter.quarter}
                    onChange={(event) => updateFilter({ quarter: Number(event.target.value) })}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#60A61F]"
                  >
                    <option value={1}>Quý 1</option>
                    <option value={2}>Quý 2</option>
                    <option value={3}>Quý 3</option>
                    <option value={4}>Quý 4</option>
                  </select>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={filter.year}
                    onChange={(event) => {
                      if (event.target.value) updateFilter({ year: Number(event.target.value) })
                    }}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#60A61F]"
                  />
                </div>
              )}

              {filter.range === 'year' && (
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={filter.year}
                  onChange={(event) => {
                    if (event.target.value) updateFilter({ year: Number(event.target.value) })
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#60A61F]"
                />
              )}

              <button
                type="button"
                onClick={() => shiftPeriod(1)}
                className="h-10 rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-600 hover:bg-slate-50"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* 4 Ô Chỉ số Tổng quan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl shadow-sm relative overflow-hidden bg-gradient-to-br from-white via-lime-100 to-emerald-100 transition-shadow duration-200 hover:shadow-2xl">
            {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10"></div>}
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">Doanh Thu ({activeLabel})</p>
            <p className="text-xl font-black text-rose-900 whitespace-nowrap">
              {data?.summary.revenue.toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] text-emerald-900 mt-2 font-medium">Tổng số đơn: {data?.summary.invoiceCount || 0}</p>
          </div>

          <div className="p-5 rounded-2xl shadow-sm relative overflow-hidden bg-gradient-to-br from-emerald-100 via-lime-100 to-pink-200 transition-shadow duration-200 hover:shadow-2xl">
            {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10"></div>}
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">Lợi Nhuận Gộp</p>
            <p className="text-xl font-black text-rose-900 whitespace-nowrap">
              {data?.summary.profit.toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] text-emerald-900 mt-2 font-medium">Chưa trừ chi phí vận hành cố định</p>
          </div>

          <div className="p-5 rounded-2xl shadow-sm relative overflow-hidden bg-gradient-to-br from-pink-100 via-rose-100 to-amber-100 transition-shadow duration-200 hover:shadow-2xl">
            {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10"></div>}
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">Tổn Thất Hao Hụt</p>
            <p className="text-xl font-black text-rose-900 whitespace-nowrap">
              {data?.summary.totalWasteCost.toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] text-emerald-900 mt-2 font-medium">Tính dựa trên giá vốn nhập vào</p>
          </div>

          <div className="p-5 rounded-2xl shadow-sm relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-200 to-orange-400 transition-shadow duration-200 hover:shadow-2xl">
            {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10"></div>}
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">Giá Trị Kho Tồn</p>
            <p className="text-xl font-black text-rose-900 whitespace-nowrap">
              {data?.summary.totalInventoryValue.toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] text-emerald-900 mt-2 font-medium">Vốn lưu động hiện tại (Cập nhật Real-time)</p>
          </div>
        </div>

        {/* Khối Đồ thị Thanh ngang */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* CỘT 1: CƠ CẤU */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm relative transition-shadow duration-200 hover:shadow-2xl">
            {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 rounded-2xl"></div>}
            <h3 style={{ color: guavaColors.textDark }} className="font-bold text-lg mb-4">📊 Kênh Bán Hàng & Phương Thức</h3>
            
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Theo kênh phân phối</p>
            <div className="space-y-3 mb-6">
              {data?.channels.length === 0 ? <p className="text-xs text-slate-400">Chưa có giao dịch.</p> : data?.channels.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span style={{ color: guavaColors.textDark }}>{c.name === 'POS' ? '🏪 Tại cửa hàng (POS)' : '🌐 Đặt hàng Online Web'}</span>
                    <span>{c.value.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ backgroundColor: guavaColors.primary, width: `${(c.value / maxChannel) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Theo phương thức thanh toán</p>
            <div className="space-y-3">
              {data?.payments.length === 0 ? <p className="text-xs text-slate-400">Chưa có giao dịch.</p> : data?.payments.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700 font-medium">{p.name}</span>
                    <span className="font-bold">{p.value.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-700 delay-100" style={{ width: `${(p.value / maxPayment) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT 2: HAO HỤT */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm relative transition-shadow duration-200 hover:shadow-2xl">
            {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 rounded-2xl"></div>}
            <h3 className="font-bold text-lg mb-2 text-red-900">📉 Phân Tích Nguyên Nhân Hao Hụt</h3>
            <p className="text-xs text-slate-400 mb-4">Dữ liệu được lọc theo khoảng thời gian được chọn</p>
            
            <div className="space-y-4">
              {data?.waste.length === 0 || totalWaste === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10 italic">Tuyệt vời! Không ghi nhận hao hụt nào.</p>
              ) : data?.waste.map((w, i) => {
                const percent = totalWaste > 0 ? ((w.cost / totalWaste) * 100).toFixed(1) : '0'
                return (
                  <div key={i} className="pb-3 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700">{wasteReasonLabels[w.reason] || w.reason}</span>
                      <span className="font-black text-red-800">{w.cost.toLocaleString('vi-VN')} ₫ <span className="text-slate-400 font-normal">({percent}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
