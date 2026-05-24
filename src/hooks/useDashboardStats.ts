import { useState, useEffect } from 'react'

export interface ChartData {
  label: string;
  value: number;
}

export interface BestSeller {
  id: string;
  name: string;
  cat: string;
  sold: number;
  img: string;
}

export interface DashboardStats {
  revenue: { label: string; value: number; formatted: string; orderCount?: number }
  profit: { label: string; value: number; formatted: string }
  expiringSoon: { label: string; value: number; formatted: string }
  lowStock: { label: string; value: number; formatted: string }
  chartData: ChartData[]
  bestSellers: BestSeller[]
  urgentBatches: {
    id: string
    batchCode: string
    productName: string
    sku: string
    unit: string
    effectiveRemaining: number
    expiredAt: string
    daysLeft: number
    status: string
    supplierName: string
  }[]
  lowStockProducts: {
    productId: string
    name: string
    sku: string
    unit: string
    totalRemaining: number
    batchCount: number
  }[]
  pendingOnlineOrders: {
    id: string
    invoiceCode: string
    finalAmount: number
    status: string
    createdAt: string
    customerName: string
  }[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        const json = await res.json()
        if (json.success) setStats(json.data)
        else setError('Không thể tải dữ liệu')
      } catch {
        setError('Lỗi kết nối')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}
