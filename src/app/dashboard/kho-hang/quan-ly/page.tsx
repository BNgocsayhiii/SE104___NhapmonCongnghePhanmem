'use client'

import React from 'react'
import { useWarehouseManagement } from '@/hooks/useWarehouseManagement'

const money = new Intl.NumberFormat('vi-VN')
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN')
}

function statusBadge(status: string, daysLeft: number) {
  if (status === 'EXPIRED' || daysLeft < 0) return 'bg-red-100 text-red-700 border-red-200'
  if (status === 'NEAR_EXPIRY' || daysLeft <= 2) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (status === 'DISPOSED') return 'bg-slate-100 text-slate-500 border-slate-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

function statusLabel(status: string, daysLeft: number) {
  if (status === 'EXPIRED' || daysLeft < 0) return 'Hết hạn'
  if (status === 'NEAR_EXPIRY' || daysLeft <= 2) return 'Cận hạn'
  if (status === 'DISPOSED') return 'Đã hủy hết'
  return 'Tươi'
}

export default function TrangQuanLyKho() {
  const { data, search, status, loading, error, setSearch, setStatus } = useWarehouseManagement()

  return (
    <div className="fade-up min-h-full bg-transparent p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase text-[#1a4d2e]">Quản lý kho</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Theo dõi tồn kho, ưu tiên xử lý các lô sắp hết hạn.</p>
          </div>
          <div className="grid gap-2 md:grid-cols-[220px_320px]">
            <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#60A61F]" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="FRESH">Tươi</option>
              <option value="NEAR_EXPIRY">Cận hạn</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#60A61F]"
              placeholder="Tìm sản phẩm, SKU, lô, nhà cung cấp..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-xl bg-[#CBEFAA] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Tổng lô còn hàng</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.summary.batchCount || 0}</p>
          </div>
          <div className="rounded-xl bg-[#BEDE8A] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Giá trị tồn</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{money.format(data?.summary.totalInventoryValue || 0)} đ</p>
          </div>
          <div className="rounded-xl bg-[#F5EE9A] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Tồn thực tế</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{number.format(data?.summary.totalEffectiveRemaining || 0)}</p>
          </div>
          <div className="rounded-xl bg-[#FBA685] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-red-900/70">Cận hạn</p>
            <p className="mt-1 text-2xl font-black text-red-950">{data?.summary.expiringCount || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Tồn thấp</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.summary.lowStockCount || 0}</p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black text-[#1a4d2e]">Lô hàng ưu tiên xử lý</h2>
              <p className="text-xs text-slate-400">Lô hết hạn/cận hạn được tự động đẩy lên đầu danh sách.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Lô / Sản phẩm</th>
                    <th className="px-5 py-3">Nhà cung cấp</th>
                    <th className="px-5 py-3 text-right">Tồn thực tế</th>
                    <th className="px-5 py-3 text-right">Giá trị</th>
                    <th className="px-5 py-3">Hạn dùng</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Đang tải dữ liệu kho...</td></tr>
                  ) : data?.batches.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Không có lô hàng phù hợp.</td></tr>
                  ) : data?.batches.map(batch => (
                    <tr key={batch.id} className="border-b border-slate-50 hover:bg-green-50/40">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-800">{batch.productName}</p>
                        <p className="text-xs text-slate-400">{batch.batchCode} - {batch.sku}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">{batch.supplierName}</p>
                        <p className="text-xs text-slate-400">{batch.receiptCode}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="font-black text-[#1a4d2e]">{number.format(batch.effectiveRemaining)} {batch.unit}</p>
                        <p className="text-xs text-slate-400">Gốc {number.format(batch.quantity)}</p>
                      </td>
                      <td className="px-5 py-4 text-right font-bold">{money.format(batch.inventoryValue)} đ</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">{formatDate(batch.expiredAt)}</p>
                        <p className={`text-xs font-bold ${batch.daysLeft <= 2 ? 'text-red-600' : 'text-slate-400'}`}>
                          {batch.daysLeft < 0 ? `Quá ${Math.abs(batch.daysLeft)} ngày` : `Còn ${batch.daysLeft} ngày`}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-black ${statusBadge(batch.status, batch.daysLeft)}`}>
                          {statusLabel(batch.status, batch.daysLeft)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-black text-[#1a4d2e]">Tổng tồn theo sản phẩm</h2>
              <div className="space-y-3">
                {data?.byProduct.slice(0, 8).map(product => (
                  <div key={product.productName} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">{product.productName}</p>
                        <p className="text-xs text-slate-400">{product.batchCount} lô</p>
                      </div>
                      <p className="text-right text-sm font-black text-[#1a4d2e]">{number.format(product.totalRemaining)} {product.unit}</p>
                    </div>
                    <p className="mt-2 text-right text-xs font-bold text-slate-500">{money.format(product.totalValue)} đ</p>
                  </div>
                ))}
                {!loading && data?.byProduct.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Chưa có tồn kho.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-black text-amber-800">Gợi ý xử lý</h2>
              <p className="text-sm font-medium text-amber-900">
                Ưu tiên bán hoặc khuyến mãi các lô cận hạn trước. Lô đã quá hạn nên chuyển sang màn hình hủy hàng để ghi nhận hao hụt và lưu vết thao tác.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
