'use client'

import { useCallback, useEffect, useState } from 'react'

export type WasteReason = 'EXPIRED' | 'DAMAGED' | 'BIOLOGICAL' | 'PROMOTION' | 'OTHER'

export interface WasteBatchOption {
  id: string
  batchCode: string
  productName: string
  unit: string
  supplierName: string
  remaining: number
  effectiveRemaining: number
  importPrice: number
  expiredAt: string
  status: string
}

export interface WasteLogItem {
  id: string
  batchCode: string
  productName: string
  unit: string
  quantity: number
  reason: WasteReason
  note?: string | null
  createdByName: string
  createdAt: string
  cost: number
}

interface WarehouseWasteData {
  batches: WasteBatchOption[]
  wasteLogs: WasteLogItem[]
  summary: {
    todayCount: number
    todayQuantity: number
    monthCount: number
    monthQuantity: number
  }
}

export interface WasteDraft {
  batchId: string
  quantity: string
  reason: WasteReason
  note: string
}

export function useWarehouseWaste() {
  const [data, setData] = useState<WarehouseWasteData | null>(null)
  const [draft, setDraft] = useState<WasteDraft>({ batchId: '', quantity: '', reason: 'EXPIRED', note: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [historyFilter, setHistoryFilter] = useState({
    filterType: 'month',
    filterValue: new Date().toISOString().slice(0, 7),
  })

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (historyFilter.filterValue) {
        params.set('filterType', historyFilter.filterType)
        params.set('filterValue', historyFilter.filterValue)
      }
      const res = await fetch(`/api/kho-hang/huy-hang?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được dữ liệu hủy hàng')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu hủy hàng')
    } finally {
      setLoading(false)
    }
  }, [historyFilter])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const createWasteLog = useCallback(async () => {
    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    try {
      const res = await fetch('/api/kho-hang/huy-hang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: draft.batchId,
          quantity: Number(draft.quantity),
          reason: draft.reason,
          note: draft.note,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không hủy được hàng')

      setSuccessMessage('Đã ghi nhận hủy hàng')
      setDraft(current => ({ ...current, quantity: '', note: '' }))
      await refreshData()
      return json.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy được hàng')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [draft, refreshData])

  const quickDisposeExpired = useCallback(async () => {
    const expiredBatches = (data?.batches || []).filter(batch => batch.status === 'EXPIRED' || new Date(batch.expiredAt).getTime() < Date.now())
    if (expiredBatches.length === 0) {
      setError('Không có lô hết hạn để hủy nhanh')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    try {
      for (const batch of expiredBatches) {
        const res = await fetch('/api/kho-hang/huy-hang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batchId: batch.id,
            quantity: batch.effectiveRemaining,
            reason: 'EXPIRED',
            note: 'Hủy nhanh lô hết hạn',
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Không hủy nhanh được lô hết hạn')
      }
      setSuccessMessage(`Đã hủy nhanh ${expiredBatches.length} lô hết hạn`)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy nhanh được lô hết hạn')
    } finally {
      setSubmitting(false)
    }
  }, [data?.batches, refreshData])

  return {
    data,
    draft,
    historyFilter,
    loading,
    submitting,
    error,
    successMessage,
    setDraft,
    setHistoryFilter,
    createWasteLog,
    quickDisposeExpired,
    refreshData,
  }
}
