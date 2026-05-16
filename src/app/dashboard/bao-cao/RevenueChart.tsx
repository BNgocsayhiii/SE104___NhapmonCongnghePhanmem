'use client'
import { useEffect, useRef, useState } from 'react'

type Period = 'ngay' | 'tuan' | 'thang'
type DataPoint = { label: string; pos: number; online: number }

export default function RevenueChart() {
  const [period, setPeriod] = useState<Period>('ngay')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<unknown>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard/revenue?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [period])

  useEffect(() => {
    if (!data.length || !chartRef.current) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartInstance.current) (chartInstance.current as InstanceType<typeof Chart>).destroy()
      chartInstance.current = new Chart(chartRef.current!, {
        type: 'bar',
        data: {
          labels: data.map(d => d.label),
          datasets: [
            { label: 'Tại quầy', data: data.map(d => d.pos), backgroundColor: '#1a4d2e', borderRadius: 4 },
            { label: 'Online', data: data.map(d => d.online), backgroundColor: '#f97316', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${(ctx.raw as number).toLocaleString('vi-VN')}đ` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { callback: v => (Number(v) / 1000).toFixed(0) + 'k', font: { size: 11 } } },
          },
        },
      })
    })
    return () => {
      if (chartInstance.current) (chartInstance.current as InstanceType<typeof Chart>).destroy()
    }
  }, [data])

  const periods: { key: Period; label: string }[] = [
    { key: 'ngay', label: 'Ngày' },
    { key: 'tuan', label: 'Tuần' },
    { key: 'thang', label: 'Tháng' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Doanh thu theo thời gian</h3>
        <div className="flex gap-1">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`text-xs px-3 py-1 rounded-md border transition ${
                period === p.key ? 'bg-[#1a4d2e] text-white border-[#1a4d2e]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">Đang tải...</div>
      ) : (
        <div className="relative h-48">
          <canvas ref={chartRef} role="img" aria-label="Biểu đồ doanh thu" />
        </div>
      )}
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1a4d2e] inline-block" />Tại quầy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#f97316] inline-block" />Online
        </span>
      </div>
    </div>
  )
}