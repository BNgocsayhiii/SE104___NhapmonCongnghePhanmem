'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type PaymentMethod = 'CASH' | 'QR'
export type SaleChannel = 'POS' | 'ONLINE'

export interface SaleBatch {
  id: string
  batchCode: string
  remaining: number
  effectiveRemaining: number
  expiredAt: string
  status: string
}

export interface SaleProduct {
  id: string
  sku: string
  name: string
  unit: string
  currentPrice: number
  batches: SaleBatch[]
}

export interface SaleCustomer {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  points: number
}

export interface CartItem {
  productId: string
  batchId?: string
  quantity: number
}

export interface NewCustomerDraft {
  name: string
  phone: string
  email: string
  address: string
}

export function useCreateSalesInvoice() {
  const [products, setProducts] = useState<SaleProduct[]>([])
  const [customers, setCustomers] = useState<SaleCustomer[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newCustomer, setNewCustomer] = useState<NewCustomerDraft>({ name: '', phone: '', email: '', address: '' })
  const [discountPercent, setDiscountPercent] = useState(0)
  const [pointsUsed, setPointsUsed] = useState(0)
  const [shippingFee, setShippingFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [channel, setChannel] = useState<SaleChannel>('POS')
  const [shippingAddress, setShippingAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ban-hang/tao-hoa-don')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tải được dữ liệu bán hàng')
      setProducts(json.data.products || [])
      setCustomers(json.data.customers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu bán hàng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId],
  )

  const cartDetails = useMemo(() => {
    return cartItems.map((item) => {
      const product = products.find((entry) => entry.id === item.productId)
      const batch = product?.batches.find((entry) => entry.id === item.batchId)
      const unitPrice = product?.currentPrice || 0
      return {
        ...item,
        product,
        batch,
        unitPrice,
        subtotal: item.quantity * unitPrice,
        available: batch
          ? batch.effectiveRemaining
          : product?.batches.reduce((sum, entry) => sum + entry.effectiveRemaining, 0) || 0,
      }
    })
  }, [cartItems, products])

  const totalAmount = useMemo(
    () => cartDetails.reduce((sum, item) => sum + item.subtotal, 0),
    [cartDetails],
  )

  const discountAmount = useMemo(
    () => Math.round(totalAmount * (Math.min(Math.max(discountPercent, 0), 100) / 100)),
    [discountPercent, totalAmount],
  )

  const pointDiscount = Math.max(pointsUsed, 0) * 1000
  const finalAmount = Math.max(totalAmount - discountAmount - pointDiscount + Math.max(shippingFee, 0), 0)

  const addItem = useCallback((productId: string, batchId?: string) => {
    if (!productId) return
    setCartItems((current) => {
      const foundIndex = current.findIndex((item) => item.productId === productId && item.batchId === batchId)
      if (foundIndex >= 0) {
        return current
      }
      return [...current, { productId, batchId, quantity: 0 }]
    })
  }, [])

  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    const normalizedQuantity = Number.isFinite(quantity) ? Math.max(quantity, 0) : 0
    setCartItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity: normalizedQuantity } : item)),
    )
  }, [])

  const removeItem = useCallback((index: number) => {
    setCartItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }, [])

  const resetForm = useCallback(() => {
    setCartItems([])
    setSelectedCustomerId('')
    setNewCustomer({ name: '', phone: '', email: '', address: '' })
    setDiscountPercent(0)
    setPointsUsed(0)
    setShippingFee(0)
    setPaymentMethod('CASH')
    setChannel('POS')
    setShippingAddress('')
  }, [])

  const createInvoice = useCallback(async () => {
    if (cartItems.length === 0) {
      setError('Vui lòng thêm sản phẩm vào hóa đơn')
      return null
    }

    if (cartItems.some((item) => item.quantity <= 0)) {
      setError('Vui lòng nhập số lượng cho tất cả sản phẩm')
      return null
    }

    if (!selectedCustomerId && newCustomer.name.trim() && !newCustomer.phone.trim()) {
      setError('Vui lòng nhập số điện thoại để thêm khách hàng mới')
      return null
    }

    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    try {
      const res = await fetch('/api/ban-hang/tao-hoa-don', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId || undefined,
          customer: !selectedCustomerId && newCustomer.name.trim() && newCustomer.phone.trim() ? newCustomer : undefined,
          items: cartItems,
          discountPercent,
          pointsUsed,
          shippingFee,
          paymentMethod,
          channel,
          shippingAddress,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Không tạo được hóa đơn')

      setSuccessMessage(`Đã tạo hóa đơn ${json.data.invoiceCode}`)
      resetForm()
      await refreshData()
      return json.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được hóa đơn')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [
    cartItems,
    channel,
    discountPercent,
    newCustomer,
    paymentMethod,
    pointsUsed,
    refreshData,
    resetForm,
    selectedCustomerId,
    shippingAddress,
    shippingFee,
  ])

  return {
    products,
    customers,
    cartItems,
    cartDetails,
    selectedCustomerId,
    selectedCustomer,
    newCustomer,
    discountPercent,
    pointsUsed,
    shippingFee,
    paymentMethod,
    channel,
    shippingAddress,
    loading,
    submitting,
    error,
    successMessage,
    totalAmount,
    discountAmount,
    pointDiscount,
    finalAmount,
    setSelectedCustomerId,
    setNewCustomer,
    setDiscountPercent,
    setPointsUsed,
    setShippingFee,
    setPaymentMethod,
    setChannel,
    setShippingAddress,
    addItem,
    updateItemQuantity,
    removeItem,
    createInvoice,
    refreshData,
  }
}
