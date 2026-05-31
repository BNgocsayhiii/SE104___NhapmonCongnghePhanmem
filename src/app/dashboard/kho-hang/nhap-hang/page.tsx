'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useWarehouseImport, DraftSupplier, DraftProduct } from '@/hooks/useWarehouseImport'

interface SupplierSmartInputProps {
  suppliers: any[]
  draftSupplier: DraftSupplier
  onChange: (supplier: DraftSupplier) => void
}

function SupplierSmartInput({ suppliers, draftSupplier, onChange }: SupplierSmartInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    if (!draftSupplier.name.trim() || draftSupplier.id) return suppliers
    return suppliers.filter(s => s.name.toLowerCase().includes(draftSupplier.name.toLowerCase()))
  }, [suppliers, draftSupplier.name, draftSupplier.id])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onChange({ ...draftSupplier, id: '', name: value })
    setIsOpen(true)
  }

  const handleSelect = (supplier: any) => {
    onChange({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || ''
    })
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative mb-4">
      <label className="block text-xs font-black uppercase text-slate-600 mb-1">Nhà cung cấp đối tác</label>
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#60A61F]"
          placeholder="Gõ tên nhà cung cấp (chọn hoặc tạo mới)..."
          value={draftSupplier.name}
          onChange={handleTextChange}
          onFocus={() => setIsOpen(true)}
        />
        {draftSupplier.id && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
            Đã chọn đối tác cũ
          </span>
        )}
      </div>

      {isOpen && !draftSupplier.id && draftSupplier.name && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {filtered.map(supplier => (
            <div
              key={supplier.id}
              className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-green-50 hover:text-[#1a4d2e]"
              onClick={() => handleSelect(supplier)}
            >
              {supplier.name} {supplier.phone ? `(${supplier.phone})` : ''}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-3 text-xs font-bold text-slate-500 text-center">
              Chưa có đối tác này. Tiếp tục điền thông tin bên dưới để tạo mới.
            </div>
          )}
        </div>
      )}

      {!draftSupplier.id && draftSupplier.name && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 rounded-xl bg-slate-50 p-3 border border-slate-200 border-dashed">
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#60A61F]" placeholder="Số điện thoại" value={draftSupplier.phone} onChange={e => onChange({ ...draftSupplier, phone: e.target.value })} />
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#60A61F]" placeholder="Người đại diện" value={draftSupplier.contactPerson} onChange={e => onChange({ ...draftSupplier, contactPerson: e.target.value })} />
          <input className="sm:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#60A61F]" placeholder="Địa chỉ đối tác" value={draftSupplier.address} onChange={e => onChange({ ...draftSupplier, address: e.target.value })} />
        </div>
      )}
    </div>
  )
}

interface ProductSmartInputProps {
  products: any[]
  categories: any[]
  draftProduct: DraftProduct
  onChange: (product: DraftProduct) => void
}

function ProductSmartInput({ products, categories, draftProduct, onChange }: ProductSmartInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    if (!draftProduct.name.trim() || draftProduct.id) return products
    return products.filter(p => p.name.toLowerCase().includes(draftProduct.name.toLowerCase()) || p.sku.toLowerCase().includes(draftProduct.name.toLowerCase()))
  }, [products, draftProduct.name, draftProduct.id])

  return (
    <div ref={containerRef} className="relative w-full mb-3">
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#60A61F]"
          placeholder="Gõ tìm trái cây có sẵn hoặc tạo mặt hàng mới..."
          value={draftProduct.name}
          onChange={(e) => {
            onChange({ ...draftProduct, id: '', name: e.target.value })
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
        {draftProduct.id && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Đã chọn hàng cũ
          </span>
        )}
      </div>

      {isOpen && !draftProduct.id && draftProduct.name && (
        <div className="absolute z-40 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {filtered.map(p => (
            <div
              key={p.id}
              className="cursor-pointer px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-green-50"
              onClick={() => {
                onChange({ ...draftProduct, id: p.id, name: `${p.name} - ${p.sku}`, shelfLifeDays: p.shelfLifeDays.toString() })
                setIsOpen(false)
              }}
            >
              {p.name} <span className="text-xs text-slate-400">({p.sku})</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-3 text-center text-xs font-bold text-slate-400">
              Mặt hàng mới. Vui lòng nhập thông tin phía dưới.
            </div>
          )}
        </div>
      )}

      {!draftProduct.id && draftProduct.name && (
        <div className="mt-2 grid gap-2 md:grid-cols-4 rounded-xl bg-orange-50/50 p-3 border border-orange-200 border-dashed">
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-400" placeholder="Mã SKU (Tự động)" value={draftProduct.sku} onChange={e => onChange({ ...draftProduct, sku: e.target.value })} />
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-400" placeholder="ĐVT (VD: kg)" value={draftProduct.unit} onChange={e => onChange({ ...draftProduct, unit: e.target.value })} />
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-400" type="number" placeholder="HSD (Ngày)" value={draftProduct.shelfLifeDays} onChange={e => onChange({ ...draftProduct, shelfLifeDays: e.target.value })} />
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-400" value={draftProduct.categoryId} onChange={e => onChange({ ...draftProduct, categoryId: e.target.value })}>
            <option value="">Chọn danh mục...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

export default function TrangNhapHang() {
  const { data, draft, historyFilter, loading, submitting, error, successMessage, setDraft, setHistoryFilter, createImport } = useWarehouseImport()
  
  const estimatedTotal = useMemo(() => draft.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.importPrice || 0), 0), [draft.lines])

  const updateLine = (index: number, patch: Partial<typeof draft.lines[number]>) => {
    setDraft({ ...draft, lines: draft.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line) })
  }

  const addLine = () => setDraft({ ...draft, lines: [...draft.lines, { product: { id: '', name: '', sku: '', unit: 'kg', shelfLifeDays: '5', currentPrice: '', categoryId: '' }, quantity: '', importPrice: '', packagedAt: new Date().toISOString().slice(0, 10) }] })
  const removeLine = (index: number) => draft.lines.length > 1 && setDraft({ ...draft, lines: draft.lines.filter((_, lineIndex) => lineIndex !== index) })

  return (
    <div className="h-[calc(100vh-32px)] overflow-hidden p-4 text-slate-800">
      <div className="mx-auto flex h-full max-w-[1400px] gap-6">
        
        {/* === CỘT TRÁI: FORM NHẬP HÀNG === */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase text-[#1a4d2e]">Nhập hàng</h1>
              <p className="mt-1 text-sm font-semibold text-slate-600">Gõ tên tìm kiếm, nếu chưa có hệ thống tự động khởi tạo.</p>
            </div>
          </div>

          {(error || successMessage) && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
              {error || successMessage}
            </div>
          )}

          <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <SupplierSmartInput 
              suppliers={data?.suppliers || []} 
              draftSupplier={draft.supplier} 
              onChange={(sup) => setDraft({ ...draft, supplier: sup })} 
            />

            <div className="mb-4 mt-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#1a4d2e]">Danh sách lô hàng</h2>
              <button type="button" onClick={addLine} className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-[#1a4d2e] hover:bg-green-100">+ Thêm dòng</button>
            </div>

            <div className="space-y-4">
              {draft.lines.map((line, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-600">Dòng {index + 1}</span>
                    {draft.lines.length > 1 && <button type="button" onClick={() => removeLine(index)} className="text-xs font-bold text-red-600 hover:underline">Xóa dòng</button>}
                  </div>

                  <ProductSmartInput 
                    products={data?.products || []} 
                    categories={data?.categories || []}
                    draftProduct={line.product}
                    onChange={(prod) => updateLine(index, { product: prod })}
                  />

                  <div className="grid gap-2 md:grid-cols-3">
                    <input className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#60A61F]" type="number" min="0" step="0.1" placeholder="Số lượng nhập" value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} />
                    <input className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#60A61F]" type="number" min="0" placeholder="Giá nhập (VNĐ)" value={line.importPrice} onChange={(e) => updateLine(index, { importPrice: e.target.value })} />
                    <input className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#60A61F]" type="date" title="Ngày đóng gói/nhập" value={line.packagedAt} onChange={(e) => updateLine(index, { packagedAt: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#60A61F]" placeholder="Ghi chú phiếu nhập..." value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-lime-700 p-4 text-white shadow-xl">
              <div>
                <p className="text-xs font-bold uppercase text-slate-300">Dự kiến tổng chi</p>
                <p className="text-2xl font-black">{new Intl.NumberFormat('vi-VN').format(estimatedTotal)} ₫</p>
              </div>
              <button
                className="rounded-xl bg-gradient-to-r from-lime-500 to-pink-300 px-8 py-3 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-colors duration-200 hover:from-lime-400 hover:via-fuchsia-200 hover:to-pink-200 disabled:opacity-50"
                onClick={createImport}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : 'Hoàn tất Nhập Hàng'}
              </button>
            </div>
          </section>
        </div>

        {/* === CỘT PHẢI: LỊCH SỬ NHẬP HÀNG === */}
        <div className="hidden w-[400px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm lg:flex">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase text-[#1a4d2e]">Lịch sử nhập</h2>
            <input 
              type="month" 
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold outline-none focus:border-[#60A61F]"
              value={historyFilter.filterValue}
              onChange={(e) => setHistoryFilter({ filterType: 'month', filterValue: e.target.value })}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <p className="text-xs font-bold text-slate-500">Tổng chi tháng</p>
              <p className="text-lg font-black text-slate-800">{new Intl.NumberFormat('vi-VN').format(data?.summary?.monthCost || 0)} ₫</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 border border-green-100">
              <p className="text-xs font-bold text-green-600">Số phiếu nhập</p>
              <p className="text-lg font-black text-green-800">{data?.summary?.receiptCount || 0} phiếu</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center text-sm font-semibold text-slate-500 mt-10">Đang tải lịch sử...</p>
            ) : data?.receipts && data.receipts.length > 0 ? (
              <div className="space-y-3">
                {data.receipts.map(receipt => (
                  <div key={receipt.id} className="rounded-xl border border-slate-200 p-3 transition hover:border-[#60A61F] hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <span className="font-black text-[#1a4d2e]">{receipt.receiptCode}</span>
                      <span className="text-sm font-black text-slate-800">
                        {new Intl.NumberFormat('vi-VN').format(receipt.totalAmount)} ₫
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-600 truncate" title={receipt.supplierName}>
                      {receipt.supplierName}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>{new Date(receipt.createdAt).toLocaleDateString('vi-VN')} {new Date(receipt.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{receipt.batches.length} mặt hàng</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm font-semibold text-slate-500 mt-10">Không có dữ liệu nhập hàng tháng này.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}