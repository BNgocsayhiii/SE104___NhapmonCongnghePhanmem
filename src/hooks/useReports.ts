import { useState, useEffect } from 'react'

export type TimeRange = 'day' | 'month' | 'quarter' | 'year'

export interface ReportData {
  summary: {
    invoiceCount: number
    revenue: number
    profit: number
    discount: number
    totalWasteCost: number
    totalInventoryValue: number
  }
  channels: { name: string; value: number }[]
  payments: { name: string; value: number }[]
  waste: { reason: string; cost: number }[]
}

export function useReports() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReport() {
      setLoading(true) // Reset loading state mỗi khi đổi tab
      try {
        const res = await fetch(`/api/bao-cao?range=${timeRange}`)
        const json = await res.json()
        if (json.success) setData(json.data)
        else setError('Không thể tải dữ liệu báo cáo')
      } catch {
        setError('Lỗi kết nối hệ thống')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [timeRange]) // Hook sẽ tự chạy lại khi timeRange thay đổi

  return { data, loading, error, timeRange, setTimeRange }
}