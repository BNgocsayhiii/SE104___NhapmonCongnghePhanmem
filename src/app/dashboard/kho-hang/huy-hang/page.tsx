'use client'

import React, { useMemo, useState } from 'react'
import { useWarehouseWaste, WasteReason } from '@/hooks/useWarehouseWaste'

const money = new Intl.NumberFormat('vi-VN')
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

const reasonLabels: Record<WasteReason, string> = {
  EXPIRED: 'Hết hạn / Thối hỏng',
  DAMAGED: 'Hư hỏng / Dập nát',
  BIOLOGICAL: 'Hao hụt sinh học',
  PROMOTION: 'Sampling / Khuyến mãi',
  OTHER: 'Lý do khác',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN')
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export default function TrangHuyHang() {
  const [openForm, setOpenForm] = useState(false)

  const { data, draft, historyFilter, loading, submitting, error, successMessage, setDraft, setHistoryFilter, createWasteLog, quickDisposeExpired } = useWarehouseWaste()
  const [search, setSearch] = useState('')
  const selectedBatch = data?.batches.find(batch => batch.id === draft.batchId)

  const expiredCount = (data?.batches || []).filter(batch => batch.status === 'EXPIRED' || new Date(batch.expiredAt).getTime() < Date.now()).length
  const estimatedCost = useMemo(() => selectedBatch && draft.quantity ? Number(draft.quantity) * selectedBatch.importPrice : 0, [draft.quantity, selectedBatch])
  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return data?.wasteLogs || []
    return (data?.wasteLogs || []).filter(log => `${log.batchCode} ${log.productName} ${reasonLabels[log.reason]}`.toLowerCase().includes(keyword))
  }, [data?.wasteLogs, search])

  return (
    <div className="min-h-screen p-4 text-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase text-[#1a4d2e]">Hủy hàng</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Ghi nhận hao hụt và xử lý nhanh các lô đã hết hạn.</p>
          </div>
          <button type="button" disabled={submitting || expiredCount === 0} onClick={quickDisposeExpired} className="rounded-xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50">
            Hủy nhanh {expiredCount} lô hết hạn
          </button>
        </div>

        {(error || successMessage) && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
            {error || successMessage}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-[#FBA685] p-5 shadow-sm"><p className="text-xs font-black uppercase text-red-950/80">Lượt hủy hôm nay</p><p className="mt-1 text-2xl font-black text-red-950">{data?.summary.todayCount || 0}</p></div>
          <div className="rounded-xl bg-[#F5EE9A] p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-700">Số lượng hôm nay</p><p className="mt-1 text-2xl font-black text-[#1a4d2e]">{number.format(data?.summary.todayQuantity || 0)}</p></div>
          <div className="rounded-xl bg-[#CBEFAA] p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-700">Lượt hủy tháng</p><p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.summary.monthCount || 0}</p></div>
          <div className="rounded-xl bg-[#BEDE8A] p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-700">Có thể hủy</p><p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.batches.length || 0}</p></div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)] items-start">
<section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
  {/* HEADER */}
  <button
    type="button"
    onClick={() => setOpenForm(!openForm)}
    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 rounded-xl transition-colors"
  >
    <div>
      <h2 className="text-lg font-black text-[#1a4d2e]">
        Ghi nhận hủy hàng
      </h2>
      <p className="text-xs font-semibold text-slate-500">
        Nhấn để {openForm ? 'thu gọn' : 'mở form'}
      </p>
    </div>

    <div
      className={`transition-transform duration-200 text-[#4a9b5c] ${
        openForm ? 'rotate-90' : ''
      }`}
    >
      ▶
    </div>
  </button>

  {/* CONTENT */}
  {openForm && (
    <div className="border-t border-slate-100 pt-5">
      <div className="space-y-4">
        <h2 className="text-lg font-black text-[#1a4d2e]">Ghi nhận hủy hàng</h2>

        <div className="space-y-4">
          {/* Chọn lô hàng */}
          <label className="block">
            <span className="block text-xs font-black uppercase text-slate-600 mb-1">
              Lô hàng
            </span>
            <select 
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#4a9b5c] focus:ring-1 focus:ring-[#4a9b5c]"
              value={draft.batchId} 
              onChange={(e) => setDraft({ ...draft, batchId: e.target.value })}
            >
              <option value="">Chọn lô cần hủy</option>
              {data?.batches?.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode} - {batch.productName} - còn {number.format(batch.effectiveRemaining)} {batch.unit}
                </option>
              ))}
            </select>
          </label>

          {/* Thông tin lô đã chọn */}
          {selectedBatch && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-4 text-sm">
              <p className="font-semibold text-slate-700">
                <span className="font-black">Tồn thực tế:</span> {number.format(selectedBatch.effectiveRemaining)} {selectedBatch.unit}
              </p>
              <p className="font-semibold text-slate-700">
                <span className="font-black">Hạn dùng:</span> {formatDate(selectedBatch.expiredAt)}
              </p>
              <p className="font-semibold text-slate-700">
                <span className="font-black">Giá vốn:</span> {money.format(selectedBatch.importPrice)} đ
              </p>

              <button 
                type="button" 
                onClick={() => setDraft({ 
                  ...draft, 
                  quantity: String(selectedBatch.effectiveRemaining), 
                  reason: 'EXPIRED' 
                })} 
                className="mt-3 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-black text-white transition-colors"
              >
                Hủy hết lô này
              </button>
            </div>
          )}

          {/* Số lượng hủy */}
          <label className="block">
            <span className="block text-xs font-black uppercase text-slate-600 mb-1">
              Số lượng hủy
            </span>
            <input 
              type="number" 
              min="0" 
              step="0.1"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#4a9b5c] focus:ring-1 focus:ring-[#4a9b5c]"
              value={draft.quantity} 
              onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} 
            />
          </label>

          {/* Lý do */}
          <label className="block">
            <span className="block text-xs font-black uppercase text-slate-600 mb-1">
              Lý do
            </span>
            <select 
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#4a9b5c] focus:ring-1 focus:ring-[#4a9b5c]"
              value={draft.reason} 
              onChange={(e) => setDraft({ ...draft, reason: e.target.value as WasteReason })}
            >
              {Object.entries(reasonLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          {/* Ghi chú */}
          <label className="block">
            <span className="block text-xs font-black uppercase text-slate-600 mb-1">
              Ghi chú
            </span>
            <textarea 
              className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#4a9b5c] focus:ring-1 focus:ring-[#4a9b5c]"
              placeholder={draft.reason === 'OTHER' ? 'Ghi rõ lý do khác...' : 'Mô tả tình trạng hàng hóa...'}
              value={draft.note} 
              onChange={(e) => setDraft({ ...draft, note: e.target.value })} 
            />
          </label>

          {/* Giá trị ước tính */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
            Giá trị hủy ước tính: <span className="font-black text-red-700">{money.format(estimatedCost)} đ</span>
          </div>

          {/* Nút xác nhận */}
          <button 
            type="button" 
            disabled={submitting || !draft.batchId || !draft.quantity || Number(draft.quantity) <= 0}
            onClick={createWasteLog} 
            className="w-full rounded-xl bg-red-700 py-3.5 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Đang ghi nhận...' : 'Ghi nhận hủy hàng'}
          </button>
        </div>
      </div>
    </div>
  )}
</section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-black text-[#1a4d2e]">Lịch sử hủy hàng</h2>
                <div className="grid gap-2 md:grid-cols-[220px_120px_170px]">
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Tìm lô, sản phẩm..." value={search} onChange={(event) => setSearch(event.target.value)} />
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" value={historyFilter.filterType} onChange={(event) => setHistoryFilter({ filterType: event.target.value, filterValue: event.target.value === 'year' ? String(new Date().getFullYear()) : event.target.value === 'day' ? todayInputValue() : todayInputValue().slice(0, 7) })}>
                    <option value="day">Theo ngày</option>
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" type={historyFilter.filterType === 'day' ? 'date' : historyFilter.filterType === 'year' ? 'number' : 'month'} value={historyFilter.filterValue} onChange={(event) => setHistoryFilter({ ...historyFilter, filterValue: event.target.value })} />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Thời gian</th>
                    <th className="px-5 py-3">Sản phẩm / Lô</th>
                    <th className="px-5 py-3">Lý do</th>
                    <th className="px-5 py-3 text-right">Số lượng</th>
                    <th className="px-5 py-3 text-right">Giá trị</th>
                    <th className="px-5 py-3">Người thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center font-semibold text-slate-600">Đang tải dữ liệu...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center font-semibold text-slate-600">Chưa có lịch sử hủy hàng.</td></tr>
                  ) : filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-red-50/30">
                      <td className="px-5 py-4 font-semibold text-slate-700">{formatDate(log.createdAt)}</td>
                      <td className="px-5 py-4"><p className="font-bold text-slate-900">{log.productName}</p><p className="text-xs font-semibold text-slate-600">{log.batchCode}</p></td>
                      <td className="px-5 py-4"><p className="font-bold text-slate-800">{reasonLabels[log.reason]}</p>{log.note && <p className="text-xs font-semibold text-slate-600">{log.note}</p>}</td>
                      <td className="px-5 py-4 text-right font-bold">{number.format(log.quantity)} {log.unit}</td>
                      <td className="px-5 py-4 text-right font-black text-red-700">{money.format(log.cost)} đ</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{log.createdByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
