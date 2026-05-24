'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useCreateSalesInvoice } from '@/hooks/useCreateSalesInvoice'

const money = new Intl.NumberFormat('vi-VN')

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function kgToGram(quantity: number) {
  return Math.round((quantity || 0) * 1000)
}

function kgToHundredGramUnit(quantity: number) {
  return Math.round((quantity || 0) * 10)
}

function hundredGramUnitToKg(quantity: number) {
  return Math.max(quantity || 0, 0) / 10
}

export default function CreateSalesInvoicePage() {
  const [productSearch, setProductSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const {
    products,
    customers,
    cartDetails,
    selectedCustomerId,
    selectedCustomer,
    newCustomer,
    discountPercent,
    pointsUsed,
    shippingFee,
    paymentMethod,
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
    addItem,
    updateItemQuantity,
    removeItem,
    createInvoice,
  } = useCreateSalesInvoice()

  useEffect(() => {
    if (!selectedCustomerId && !newCustomer.name) setCustomerSearch('')
  }, [newCustomer.name, selectedCustomerId])

  const filteredProducts = useMemo(() => {
    const keyword = normalizeText(productSearch.trim())
    if (!keyword) return products
    return products.filter((product) =>
      normalizeText(`${product.name} ${product.sku}`).includes(keyword),
    )
  }, [productSearch, products])

  const customerSuggestions = useMemo(() => {
    const keyword = normalizeText(customerSearch.trim())
    if (!keyword || selectedCustomerId) return []
    return customers
      .filter((customer) => normalizeText(customer.name).includes(keyword))
      .slice(0, 6)
  }, [customerSearch, customers, selectedCustomerId])

  const isNewCustomer = !selectedCustomerId && customerSearch.trim().length > 0

  return (
    <div className="h-[calc(100vh-28px)] overflow-hidden p-4 pb-2">
      <style jsx global>{`
        .sale-input {
          width: 100%;
          border: 1px solid #dce7dd;
          border-radius: 8px;
          padding: 8px 10px;
          background: white;
          color: #1f2937;
          font-size: 13px;
          outline: none;
        }
        .sale-input:focus {
          border-color: #4a9b5c;
          box-shadow: 0 0 0 3px rgba(74, 155, 92, 0.12);
        }
        .sale-panel {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e6eee6;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }
      `}</style>

      <div className="mx-auto flex h-full max-w-7xl flex-col gap-2">
        <div>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-[#1a4d2e]">Tạo hóa đơn bán hàng</h1>
            <p className="text-sm leading-tight text-slate-500">Chọn sản phẩm, khách hàng, thanh toán và trừ tồn kho theo lô.</p>
          </div>
        </div>

        {(error || successMessage) && (
          <div className={`rounded-lg border px-4 py-2 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
            {error || successMessage}
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          <section className="sale-panel flex min-h-0 flex-col p-4 pb-3">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="font-bold text-slate-800">Sản phẩm đang bán</h2>
              <input
                className="sale-input md:w-72"
                placeholder="Tìm tên hoặc SKU"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-400">Đang tải dữ liệu...</div>
            ) : (
              <div className="grid min-h-0 flex-1 auto-rows-max gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                {filteredProducts.map((product) => {
                  const available = product.batches.reduce((sum, batch) => sum + batch.effectiveRemaining, 0)
                  const firstBatch = product.batches[0]

                  return (
                    <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {product.sku} - Tồn: {money.format(kgToGram(available))} gram
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-[#4a9b5c]">{money.format(product.currentPrice)} đ/kg</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <select
                          id={`batch-${product.id}`}
                          className="sale-input flex-1"
                          defaultValue={firstBatch?.id || ''}
                        >
                          {product.batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batchCode} - {money.format(kgToGram(batch.effectiveRemaining))} gram
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="rounded-lg bg-[#4a9b5c] px-4 text-sm font-bold text-white hover:bg-[#347a45]"
                          onClick={() => {
                            const select = document.getElementById(`batch-${product.id}`) as HTMLSelectElement | null
                            addItem(product.id, select?.value || undefined)
                          }}
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="flex min-h-0 flex-col gap-3">
            <div className="sale-panel p-3">
              <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative">
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Khách hàng</label>
                  <input
                    className="sale-input"
                    placeholder="Nhập tên khách hàng"
                    value={customerSearch}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    onChange={(event) => {
                      const value = event.target.value
                      setCustomerSearch(value)
                      setSelectedCustomerId('')
                      setNewCustomer({ ...newCustomer, name: value })
                      setShowCustomerSuggestions(true)
                    }}
                  />
                  {showCustomerSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {customerSuggestions.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-green-50"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSelectedCustomerId(customer.id)
                            setNewCustomer({ name: '', phone: '', email: '', address: '' })
                            setCustomerSearch(customer.name)
                            setShowCustomerSuggestions(false)
                          }}
                        >
                          {customer.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-slate-700">
                    <p><span className="font-bold">SĐT:</span> {selectedCustomer.phone}</p>
                    <p><span className="font-bold">Địa chỉ:</span> {selectedCustomer.address || 'Chưa có'}</p>
                    <p><span className="font-bold">Điểm tích lũy:</span> {selectedCustomer.points}</p>
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {isNewCustomer && (
                      <>
                        <input className="sale-input" placeholder="Số điện thoại" value={newCustomer.phone} onChange={(event) => setNewCustomer({ ...newCustomer, phone: event.target.value })} />
                        <input className="sale-input" placeholder="Địa chỉ" value={newCustomer.address} onChange={(event) => setNewCustomer({ ...newCustomer, address: event.target.value })} />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sale-panel flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="font-bold text-slate-800">Hóa đơn</h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {cartDetails.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">Chưa có sản phẩm nào.</div>
                ) : (
                  cartDetails.map((item, index) => (
                    <div key={`${item.productId}-${item.batchId}-${index}`} className="grid grid-cols-[1fr_104px_98px_28px] items-center gap-2 border-b border-dashed border-slate-100 p-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.product?.name || 'Sản phẩm'}</p>
                        <p className="text-xs text-slate-500">
                          {item.batch?.batchCode || 'FIFO'} - {money.format(item.unitPrice)} đ/kg
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          className="sale-input pr-12"
                          type="number"
                          min="0"
                          step="1"
                          title="Nhập 1 = 100 gram, 10 = 1000 gram"
                          value={item.quantity > 0 ? kgToHundredGramUnit(item.quantity) : ''}
                          onChange={(event) => {
                            const value = event.target.value
                            updateItemQuantity(index, value ? hundredGramUnitToKg(Number(value)) : 0)
                          }}
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">x100g</span>
                      </div>
                      <p className="text-right text-sm font-bold text-[#1a4d2e]">
                        {item.quantity > 0 ? `${money.format(item.subtotal)} đ` : ''}
                      </p>
                      <button type="button" className="text-lg font-bold text-slate-400 hover:text-red-500" onClick={() => removeItem(index)}>
                        x
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="sale-panel p-3">
              <div className="grid gap-2 md:grid-cols-4">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Thanh toán
                  <select className="sale-input mt-1" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'CASH' | 'QR')}>
                    <option value="CASH">Tiền mặt</option>
                    <option value="QR">Qua QR</option>
                  </select>
                </label>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Giảm giá %
                  <input className="sale-input mt-1" type="number" min="0" max="100" value={discountPercent} onChange={(event) => setDiscountPercent(Number(event.target.value))} />
                </label>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Dùng điểm
                  <input className="sale-input mt-1" type="number" min="0" value={pointsUsed} onChange={(event) => setPointsUsed(Number(event.target.value))} />
                </label>
                <label className="text-xs font-bold uppercase text-slate-500">
                  Phí giao hàng
                  <input className="sale-input mt-1" type="number" min="0" value={shippingFee} onChange={(event) => setShippingFee(Number(event.target.value))} />
                </label>
              </div>

              <div className="mt-2 grid gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-sm font-semibold text-slate-600 md:grid-cols-2">
                <div className="flex justify-between"><span>Tạm tính</span><span>{money.format(totalAmount)} đ</span></div>
                <div className="flex justify-between text-red-600"><span>Giảm giá</span><span>- {money.format(discountAmount + pointDiscount)} đ</span></div>
                <div className="flex justify-between"><span>Phí giao hàng</span><span>{money.format(shippingFee)} đ</span></div>
                <div className="flex items-end justify-between text-lg font-black text-[#1a4d2e]">
                  <span>Thành tiền</span>
                  <span>{money.format(finalAmount)} đ</span>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting || cartDetails.length === 0}
                onClick={createInvoice}
                className="mt-2 w-full rounded-lg bg-[#1a4d2e] py-3 text-sm font-black text-white hover:bg-[#123821] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Đang tạo hóa đơn...' : 'Tạo hóa đơn'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
