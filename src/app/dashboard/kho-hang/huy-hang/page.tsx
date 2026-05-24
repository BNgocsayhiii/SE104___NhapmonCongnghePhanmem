'use client'

import React, { useMemo } from 'react'
import { useWarehouseWaste, WasteReason } from '@/hooks/useWarehouseWaste'

const money = new Intl.NumberFormat('vi-VN')
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

const reasonLabels: Record<WasteReason, string> = {
  EXPIRED: 'Hết hạn / Thối hỏng',
  DAMAGED: 'Hư hỏng / Dập nát do vận chuyển',
  BIOLOGICAL: 'Hao hụt sinh học (Bay hơi nước)',
  PROMOTION: 'Hàng cắt ra làm Sampling (Dùng thử)',
  OTHER: 'Lý do khác',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function TrangHuyHang() {
  const { data, draft, loading, submitting, error, successMessage, setDraft, createWasteLog } = useWarehouseWaste()
  const selectedBatch = data?.batches.find(batch => batch.id === draft.batchId)

  const estimatedCost = useMemo(() => {
    if (!selectedBatch || !draft.quantity) return 0
    return Number(draft.quantity) * selectedBatch.importPrice
  }, [draft.quantity, selectedBatch])

  return (
    <div className="fade-up min-h-full bg-transparent p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase text-[#1a4d2e]">Hủy hàng</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Ghi nhận hao hụt, lưu vết người thao tác và lý do hủy hàng.</p>
        </div>

        {(error || successMessage) && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
            {error || successMessage}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-[#FBA685] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-red-900/70">Lượt hủy hôm nay</p>
            <p className="mt-1 text-2xl font-black text-red-950">{data?.summary.todayCount || 0}</p>
          </div>
          <div className="rounded-xl bg-[#F5EE9A] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Số lượng hôm nay</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{number.format(data?.summary.todayQuantity || 0)}</p>
          </div>
          <div className="rounded-xl bg-[#CBEFAA] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Lượt hủy tháng</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.summary.monthCount || 0}</p>
          </div>
          <div className="rounded-xl bg-[#BEDE8A] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-600">Lô còn có thể hủy</p>
            <p className="mt-1 text-2xl font-black text-[#1a4d2e]">{data?.batches.length || 0}</p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-[#1a4d2e]">Ghi nhận hủy hàng</h2>
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500">
                Lô hàng
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" value={draft.batchId} onChange={(event) => setDraft({ ...draft, batchId: event.target.value })}>
                  <option value="">Chọn lô cần hủy</option>
                  {data?.batches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchCode} - {batch.productName} - còn {number.format(batch.effectiveRemaining)} {batch.unit}
                    </option>
                  ))}
                </select>
              </label>

              {selectedBatch && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-slate-700">
                  <p><span className="font-bold">Tồn thực tế:</span> {number.format(selectedBatch.effectiveRemaining)} {selectedBatch.unit}</p>
                  <p><span className="font-bold">Hạn dùng:</span> {formatDate(selectedBatch.expiredAt)}</p>
                  <p><span className="font-bold">Giá vốn:</span> {money.format(selectedBatch.importPrice)} đ</p>
                </div>
              )}

              <label className="block text-xs font-bold uppercase text-slate-500">
                Số lượng hủy
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" type="number" min="0" step="0.1" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} />
              </label>

              <label className="block text-xs font-bold uppercase text-slate-500">
                Lý do
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]" value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value as WasteReason })}>
                  {Object.entries(reasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#60A61F]"
                placeholder={draft.reason === 'OTHER' ? 'Ghi rõ lý do khác' : 'Ghi chú tình trạng hàng'}
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              />

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Giá trị hủy ước tính: <span className="font-black text-red-700">{money.format(estimatedCost)} đ</span>
              </div>

              <button type="button" disabled={submitting} onClick={createWasteLog} className="w-full rounded-xl bg-red-700 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50">
                {submitting ? 'Đang ghi nhận...' : 'Ghi nhận hủy hàng'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black text-[#1a4d2e]">Lịch sử hủy hàng</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
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
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                  ) : data?.wasteLogs.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Chưa có lịch sử hủy hàng.</td></tr>
                  ) : data?.wasteLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-red-50/30">
                      <td className="px-5 py-4 text-slate-500">{formatDate(log.createdAt)}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{log.productName}</p>
                        <p className="text-xs text-slate-400">{log.batchCode}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">{reasonLabels[log.reason]}</p>
                        {log.note && <p className="text-xs text-slate-400">{log.note}</p>}
                      </td>
                      <td className="px-5 py-4 text-right font-bold">{number.format(log.quantity)} {log.unit}</td>
                      <td className="px-5 py-4 text-right font-black text-red-700">{money.format(log.cost)} đ</td>
                      <td className="px-5 py-4 text-slate-600">{log.createdByName}</td>
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
