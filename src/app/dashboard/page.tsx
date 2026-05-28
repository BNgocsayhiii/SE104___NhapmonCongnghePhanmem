'use client'

import React from 'react'
import Link from 'next/link'
import { useDashboardStats } from '@/hooks/useDashboardStats'

const money = new Intl.NumberFormat('vi-VN')
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN')
}

function urgencyLabel(daysLeft: number) {
  if (daysLeft < 0) return `Quá hạn ${Math.abs(daysLeft)} ngày`
  if (daysLeft === 0) return 'Hết hạn hôm nay'
  return `Còn ${daysLeft} ngày`
}

export default function DashboardOverview() {
  const { stats, loading, error } = useDashboardStats()

  const cards = [
    { label: 'Lô cần xử lý', value: stats?.expiringSoon.formatted || '0 lô', tone: 'bg-red-100 text-red-900', href: '/dashboard/kho-hang/huy-hang' },
    { label: 'Sắp hết hàng', value: stats?.lowStock.formatted || '0 mặt hàng', tone: 'bg-amber-100 text-amber-900', href: '/dashboard/kho-hang/nhap-hang' },
    { label: 'Đơn online chờ', value: `${stats?.pendingOnlineOrders.length || 0} đơn`, tone: 'bg-blue-100 text-blue-900', href: '/dashboard/ban-hang/lich-su-ban-hang' },
    { label: 'Doanh thu hôm nay', value: stats?.revenue.formatted || '0 đ', tone: 'bg-green-100 text-green-900', href: '/dashboard/bao-cao' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4ebeb] via-[#FFF9E3] to-[#caf5dd] p-6 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase text-[#124225]">Bảng điều phối khẩn cấp</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Ưu tiên xử lý hàng cận hạn, thiếu tồn và đơn online đang chờ.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
            Lợi nhuận hôm nay: <span className="text-[#1a4d2e]">{stats?.profit.formatted || '0 đ'}</span>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          {cards.map(card => (
            <Link key={card.label} href={card.href} className={`rounded-xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}>
              <p className="text-xs font-black uppercase tracking-wide opacity-80">{card.label}</p>
              <p className="mt-2 text-2xl font-black">{loading ? '...' : card.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-red-800">Lô cần xử lý ngay</h2>
                <p className="text-xs font-semibold text-slate-600">Bao gồm lô đã quá hạn và lô còn tối đa 3 ngày.</p>
              </div>
              <Link href="/dashboard/kho-hang/huy-hang" className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white hover:bg-red-800">
                Hủy hàng
              </Link>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Lô / sản phẩm</th>
                    <th className="px-5 py-3">Nhà cung cấp</th>
                    <th className="px-5 py-3 text-right">Tồn</th>
                    <th className="px-5 py-3">HSD</th>
                    <th className="px-5 py-3">Mức độ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center font-semibold text-slate-600">Đang tải dữ liệu...</td></tr>
                  ) : stats?.urgentBatches.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center font-semibold text-slate-600">Không có lô khẩn cấp.</td></tr>
                  ) : stats?.urgentBatches.map(batch => (
                    <tr key={batch.id} className="border-b border-slate-50 hover:bg-red-50/40">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">{batch.productName}</p>
                        <p className="text-xs font-semibold text-slate-600">{batch.batchCode} - {batch.sku}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{batch.supplierName}</td>
                      <td className="px-5 py-4 text-right font-black text-[#1a4d2e]">{number.format(batch.effectiveRemaining)} {batch.unit}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{formatDate(batch.expiredAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-lg px-3 py-1 text-xs font-black ${batch.daysLeft < 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {urgencyLabel(batch.daysLeft)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-amber-800">Mặt hàng sắp hết</h2>
                <Link href="/dashboard/kho-hang/nhap-hang" className="text-xs font-black text-[#1a4d2e] hover:underline">Nhập thêm</Link>
              </div>
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {loading ? <p className="font-semibold text-slate-600">Đang tải...</p> : stats?.lowStockProducts.length === 0 ? (
                  <p className="py-6 text-center text-sm font-semibold text-slate-600">Không có mặt hàng sắp hết.</p>
                ) : stats?.lowStockProducts.map(product => (
                  <div key={product.productId} className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{product.name}</p>
                        <p className="text-xs font-semibold text-slate-600">{product.sku} - {product.batchCount} lô</p>
                      </div>
                      <p className="font-black text-amber-900">{number.format(product.totalRemaining)} {product.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-black text-blue-800">Đơn online đang chờ</h2>
              <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                {loading ? <p className="font-semibold text-slate-600">Đang tải...</p> : stats?.pendingOnlineOrders.length === 0 ? (
                  <p className="py-6 text-center text-sm font-semibold text-slate-600">Không có đơn online cần xử lý.</p>
                ) : stats?.pendingOnlineOrders.map(order => (
                  <Link key={order.id} href="/dashboard/ban-hang/lich-su-ban-hang" className="block rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 hover:bg-blue-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{order.invoiceCode}</p>
                        <p className="text-xs font-semibold text-slate-600">{order.customerName} - {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-blue-900">{money.format(order.finalAmount)} đ</p>
                        <p className="text-xs font-bold text-blue-700">{order.status}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-[#1a4d2e]">Sản phẩm bán chạy</h2>
          <div className="grid gap-3 md:grid-cols-5">
            {stats?.bestSellers.map(item => (
              <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-2xl">{item.img}</p>
                <p className="mt-2 truncate font-black text-slate-900" title={item.name}>{item.name}</p>
                <p className="text-xs font-semibold text-slate-600">{item.cat}</p>
                <p className="mt-2 text-sm font-black text-[#60A61F]">{number.format(item.sold)} đã bán</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
