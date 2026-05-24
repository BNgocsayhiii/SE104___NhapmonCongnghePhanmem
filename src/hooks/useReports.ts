import { useEffect, useMemo, useState } from 'react'

export type TimeRange = 'day' | 'month' | 'quarter' | 'year'

export interface ReportFilter {
  range: TimeRange
  date: string
  month: string
  quarter: number
  year: number
}

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

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toMonthInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function currentQuarter(date: Date) {
  return Math.floor(date.getMonth() / 3) + 1
}

export function useReports() {
  const now = useMemo(() => new Date(), [])
  const [filter, setFilter] = useState<ReportFilter>({
    range: 'month',
    date: toDateInputValue(now),
    month: toMonthInputValue(now),
    quarter: currentQuarter(now),
    year: now.getFullYear(),
  })
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReport() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ range: filter.range })
        if (filter.range === 'day') params.set('date', filter.date)
        if (filter.range === 'month') params.set('month', filter.month)
        if (filter.range === 'quarter') {
          params.set('quarter', String(filter.quarter))
          params.set('year', String(filter.year))
        }
        if (filter.range === 'year') params.set('year', String(filter.year))

        const res = await fetch(`/api/bao-cao?${params.toString()}`)
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Không thể tải dữ liệu báo cáo')
        setData(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối hệ thống')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [filter])

  return { data, loading, error, filter, setFilter }
}
