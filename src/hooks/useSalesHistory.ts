import { useState, useEffect } from 'react'

export interface InvoiceItemDetails {
  id: string
  product: { name: string; unit: string }
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface InvoiceDetails {
  id: string
  invoiceCode: string
  customer?: { name: string; phone: string }
  createdBy?: { fullName: string }
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  status: string
  createdAt: string
  items: InvoiceItemDetails[]
}

export function useSalesHistory() {
  const [invoices, setInvoices] = useState<InvoiceDetails[]>([])
  const [loading, setLoading] = useState(true)
  
  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'day' | 'month'>('day')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]) // YYYY-MM-DD
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  
  // State cho Modal xem chi tiết
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      try {
        let url = `/api/ban-hang/lich-su?search=${encodeURIComponent(searchQuery)}`
        if (filterType === 'day') url += `&date=${filterDate}`
        if (filterType === 'month') url += `&month=${filterMonth}`

        const res = await fetch(url)
        const json = await res.json()
        if (json.success) setInvoices(json.data)
      } catch (error) {
        console.error('Lỗi tải lịch sử bán hàng:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Tạo delay nhỏ khi gõ tìm kiếm để không spam API (Debounce)
    const timeoutId = setTimeout(() => {
      fetchHistory()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery, filterType, filterDate, filterMonth])

  return {
    invoices, loading,
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    filterDate, setFilterDate,
    filterMonth, setFilterMonth,
    selectedInvoice, setSelectedInvoice
  }
}