'use client'

import { useCallback, useEffect, useState } from 'react'

export interface ManagedBatch {
  id: string
  batchCode: string
  receiptCode: string
  productName: string
  sku: string
  categoryName: string
  supplierName: string
  receivedByName: string
  unit: string
  quantity: number
  remaining: number
  effectiveRemaining: number
  importPrice: number
  sellPrice: number
  inventoryValue: number
  packagedAt: string
  expiredAt: string
  daysLeft: number
  status: string
  stockRatio: number
}

export interface ProductStockSummary {
  productName: string
  unit: string
  totalRemaining: number
  totalValue: number
  batchCount: number
}

interface WarehouseManagementData {
  summary: {
    batchCount: number
    totalInventoryValue: number
    totalEffectiveRemaining: number
    expiringCount: number
    expiredCount: number
    lowStockCount: number
    freshCount: number
  }
  batches: ManagedBatch[]
  byProduct: ProductStockSummary[]
}

export function useWarehouseManagement() {
  const [data, setData] = useState<WarehouseManagementData | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (status !== 'ALL') params.set('status', status)
      const res = await fetch(`/api/kho-hang/quan-ly?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được dữ liệu kho')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu kho')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return {
    data,
    search,
    status,
    loading,
    error,
    setSearch,
    setStatus,
    refreshData,
  }
}
