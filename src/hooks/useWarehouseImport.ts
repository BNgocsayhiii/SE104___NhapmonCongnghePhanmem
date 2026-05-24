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
  categories: { id: string; name: string }[]
  receipts: WarehouseReceipt[]
  summary: {
    receiptCount: number
    monthCost: number
    productCount: number
    supplierCount: number
  }
}

// Cấu trúc Draft mới hỗ trợ lưu thông tin text khi tạo mới
export interface DraftSupplier {
  id: string
  name: string
  phone: string
  address: string
  contactPerson: string
}

export interface DraftProduct {
  id: string
  name: string
  sku: string
  unit: string
  shelfLifeDays: string
  currentPrice: string
  categoryId: string
}

export interface ImportDraftLine {
  product: DraftProduct
  quantity: string
  importPrice: string
  packagedAt: string
}

export interface ImportDraft {
  supplier: DraftSupplier
  lines: ImportDraftLine[]
  note: string
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function emptyProduct(): DraftProduct {
  return { id: '', name: '', sku: '', unit: 'kg', shelfLifeDays: '5', currentPrice: '', categoryId: '' }
}

function emptyLine(): ImportDraftLine {
  return { product: emptyProduct(), quantity: '', importPrice: '', packagedAt: todayInputValue() }
}

export function useWarehouseImport() {
  const [data, setData] = useState<WarehouseImportData | null>(null)
  const [draft, setDraft] = useState<ImportDraft>({
    supplier: { id: '', name: '', phone: '', address: '', contactPerson: '' },
    lines: [emptyLine()],
    note: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [historyFilter, setHistoryFilter] = useState({
    filterType: 'month',
    filterValue: todayInputValue().slice(0, 7),
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
      const res = await fetch(`/api/kho-hang/nhap-hang?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được dữ liệu nhập hàng')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu nhập hàng')
    } finally {
      setLoading(false)
    }
  }, [historyFilter])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const createImport = useCallback(async () => {
    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    try {
      // Validate cơ bản trước khi gửi
      if (!draft.supplier.id && !draft.supplier.name.trim()) throw new Error('Vui lòng chọn hoặc nhập tên nhà cung cấp')
      if (draft.lines.some(l => !l.product.id && !l.product.name.trim())) throw new Error('Vui lòng điền đủ tên sản phẩm cho các mã mới')

      const res = await fetch('/api/kho-hang/nhap-hang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: draft.supplier,
          note: draft.note,
          lines: draft.lines.map(line => ({
            product: line.product,
            quantity: Number(line.quantity),
            importPrice: Number(line.importPrice),
            packagedAt: line.packagedAt,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không nhập được hàng')

      setSuccessMessage(`Đã nhập phiếu ${json.data.receipt.receiptCode} thành công`)
      setDraft({ supplier: { id: '', name: '', phone: '', address: '', contactPerson: '' }, lines: [emptyLine()], note: '' })
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
    historyFilter,
    loading,
    submitting,
    error,
    successMessage,
    setDraft,
    setHistoryFilter,
    createImport,
    refreshData,
  }
}