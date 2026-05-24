'use client'

import { useCallback, useEffect, useState } from 'react'

export interface WarehouseProductOption {
  id: string
  sku: string
  name: string
  unit: string
  currentPrice: number
  shelfLifeDays: number
}

export interface WarehouseSupplierOption {
  id: string
  name: string
  phone: string
  address?: string | null
}

export interface WarehouseImportBatch {
  id: string
  batchCode: string
  productName: string
  unit: string
  quantity: number
  remaining: number
  effectiveRemaining: number
  importPrice: number
  packagedAt: string
  expiredAt: string
  status: string
}

export interface WarehouseReceipt {
  id: string
  receiptCode: string
  supplierName: string
  receivedByName: string
  totalAmount: number
  note?: string | null
  createdAt: string
  batches: WarehouseImportBatch[]
}

interface WarehouseImportData {
  products: WarehouseProductOption[]
  suppliers: WarehouseSupplierOption[]
  receipts: WarehouseReceipt[]
  summary: {
    receiptCount: number
    monthCost: number
    productCount: number
    supplierCount: number
  }
}

export interface ImportDraft {
  supplierId: string
  productId: string
  quantity: string
  importPrice: string
  packagedAt: string
  note: string
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function useWarehouseImport() {
  const [data, setData] = useState<WarehouseImportData | null>(null)
  const [draft, setDraft] = useState<ImportDraft>({
    supplierId: '',
    productId: '',
    quantity: '',
    importPrice: '',
    packagedAt: todayInputValue(),
    note: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/kho-hang/nhap-hang')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được dữ liệu nhập hàng')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu nhập hàng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const createImport = useCallback(async () => {
    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    try {
      const res = await fetch('/api/kho-hang/nhap-hang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: draft.supplierId,
          productId: draft.productId,
          quantity: Number(draft.quantity),
          importPrice: Number(draft.importPrice),
          packagedAt: draft.packagedAt,
          note: draft.note,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không nhập được hàng')

      setSuccessMessage(`Đã nhập lô ${json.data.batch.batchCode}`)
      setDraft(current => ({ ...current, quantity: '', importPrice: '', note: '' }))
      await refreshData()
      return json.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không nhập được hàng')
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
    createImport,
    refreshData,
  }
}
