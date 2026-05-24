'use client'

import React, { useMemo, useState } from 'react'
import { useWarehouseImport } from '@/hooks/useWarehouseImport'

const money = new Intl.NumberFormat('vi-VN')
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function TrangNhapHang() {
  const { data, draft, loading, submitting, error, successMessage, setDraft, createImport } = useWarehouseImport()
  const [search, setSearch] = useState('')

  const selectedProduct = data?.products.find(product => product.id === draft.productId)
  const estimatedExpiry = useMemo(() => {
    if (!selectedProduct || !draft.packagedAt) return ''
    const date = new Date(`${draft.packagedAt}T00:00:00`)
    date.setDate(date.getDate() + selectedProduct.shelfLifeDays)
    return date.toLocaleDateString('vi-VN')
  }, [draft.packagedAt, selectedProduct])

  const filteredReceipts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return data?.receipts || []
    return (data?.receipts || []).filter(receipt =>
      `${receipt.receiptCode} ${receipt.supplierName} ${receipt.batches.map(batch => batch.productName).join(' ')}`.toLowerCase().includes(keyword),
    )
  }, [data?.receipts, search])

  return (
    <div className="fade-up min-h-full bg-transparent p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase text-[#1a4d2e]">Nhập hàng</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Tạo phiếu nhập theo lô, tự tính hạn dùng theo từng sản phẩm.</p>
          </div>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#60A61F] md:w-80"
            placeholder="Tìm phiếu, nhà cung cấp, sản phẩm..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {(error || successMessage) && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
            {error || successMessage}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-[#CBEFAA] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Phiếu tháng này</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.summary.receiptCount || 0}</p>
          </div>
          <div className="rounded-xl bg-[#BEDE8A] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Chi phí nhập</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{money.format(data?.summary.monthCost || 0)} đ</p>
          </div>
          <div className="rounded-xl bg-[#F5EE9A] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Sản phẩm</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.summary.productCount || 0}</p>
          </div>
          <div className="rounded-xl bg-[#FBA685] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Nhà cung cấp</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.summary.supplierCount || 0}</p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-[#1a4d2e]">Tạo lô nhập mới</h2>
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500">
                Nhà cung cấp
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" value={draft.supplierId} onChange={(event) => setDraft({ ...draft, supplierId: event.target.value })}>
                  <option value="">Chọn nhà cung cấp</option>
                  {data?.suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase text-slate-500">
                Sản phẩm
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" value={draft.productId} onChange={(event) => setDraft({ ...draft, productId: event.target.value })}>
                  <option value="">Chọn sản phẩm</option>
                  {data?.products.map(product => (
                    <option key={product.id} value={product.id}>{product.name} - HSD {product.shelfLifeDays} ngày</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-xs font-bold uppercase text-slate-500">
                  Số lượng
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" type="number" min="0" step="0.1" placeholder="kg / đơn vị" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} />
                </label>
                <label className="block text-xs font-bold uppercase text-slate-500">
                  Giá nhập
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" type="number" min="0" placeholder="đ / đơn vị" value={draft.importPrice} onChange={(event) => setDraft({ ...draft, importPrice: event.target.value })} />
                </label>
              </div>

              <label className="block text-xs font-bold uppercase text-slate-500">
                Ngày đóng gói / nhập lô
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" type="date" value={draft.packagedAt} onChange={(event) => setDraft({ ...draft, packagedAt: event.target.value })} />
              </label>

              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-bold">Hạn dùng dự kiến:</span> {estimatedExpiry || 'Chọn sản phẩm để tính'}
              </div>

              <textarea className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" placeholder="Ghi chú nhập hàng" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />

              <button type="button" disabled={submitting} onClick={createImport} className="w-full rounded-xl bg-[#1a4d2e] py-3 text-sm font-black text-white hover:bg-[#123821] disabled:opacity-50">
                {submitting ? 'Đang nhập hàng...' : 'Nhập lô hàng'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black text-[#1a4d2e]">Lịch sử nhập hàng</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Phiếu</th>
                    <th className="px-5 py-3">Lô hàng</th>
                    <th className="px-5 py-3">Nhà cung cấp</th>
                    <th className="px-5 py-3 text-right">Số lượng</th>
                    <th className="px-5 py-3 text-right">Giá nhập</th>
                    <th className="px-5 py-3">Hạn dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                  ) : filteredReceipts.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Chưa có phiếu nhập phù hợp.</td></tr>
                  ) : filteredReceipts.flatMap(receipt => receipt.batches.map(batch => (
                    <tr key={batch.id} className="border-b border-slate-50 hover:bg-green-50/40">
                      <td className="px-5 py-4">
                        <p className="font-black text-[#60A61F]">{receipt.receiptCode}</p>
                        <p className="text-xs text-slate-400">{formatDate(receipt.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{batch.productName}</p>
                        <p className="text-xs text-slate-400">{batch.batchCode}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{receipt.supplierName}</td>
                      <td className="px-5 py-4 text-right font-bold">{number.format(batch.quantity)} {batch.unit}</td>
                      <td className="px-5 py-4 text-right">{money.format(batch.importPrice)} đ</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">{formatDate(batch.expiredAt)}</p>
                        <p className="text-xs text-slate-400">{batch.status}</p>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
