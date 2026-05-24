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

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/kho-hang/huy-hang')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được dữ liệu hủy hàng')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu hủy hàng')
    } finally {
      setLoading(false)
    }
  }, [])

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

  return {
    data,
    draft,
    loading,
    submitting,
    error,
    successMessage,
    setDraft,
    createWasteLog,
    refreshData,
  }
}
