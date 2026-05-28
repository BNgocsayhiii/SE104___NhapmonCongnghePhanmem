'use client'
import React, { useState } from 'react'
import { useSuppliers, Supplier, SupplierFormData } from '@/hooks/useSuppliers'
import { useAuth } from '@/hooks/useAuth'

// ── Modal xác nhận xóa ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  supplier,
  onConfirm,
  onCancel,
  loading,
}: {
  supplier: Supplier
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <h3 className="font-bold text-slate-800 text-lg">Xác nhận xóa</h3>
        </div>
        <p className="text-slate-600 text-sm mb-1">Bạn có chắc muốn xóa nhà cung cấp:</p>
        <p className="font-bold text-[#1a4d2e] mb-1">{supplier.name}</p>
        <p className="text-xs text-slate-400 mb-5">Mã: {supplier.code} · SĐT: {supplier.phone}</p>
        <p className="text-xs text-red-500 mb-5 bg-red-50 rounded-lg px-3 py-2">
          Không thể hoàn tác. NCC đã có phiếu nhập sẽ không xóa được.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal sửa nhà cung cấp ───────────────────────────────────────────────────
function EditModal({
  supplier,
  onSave,
  onCancel,
  loading,
  error,
}: {
  supplier: Supplier
  onSave: (data: SupplierFormData) => void
  onCancel: () => void
  loading: boolean
  error: string | null
}) {
  const [form, setForm] = useState<SupplierFormData>({
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contactName === 'Chưa cập nhật' ? '' : supplier.contactName,
    phone: supplier.phone,
    email: supplier.email === '-' ? '' : supplier.email,
    address: supplier.address === 'Chưa cập nhật' ? '' : supplier.address,
  })

  const set = (field: keyof SupplierFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg">Chỉnh sửa nhà cung cấp</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">{error}</div>
        )}

        <div className="space-y-3">
          {[
            { label: 'Tên nhà cung cấp *', field: 'name' as const, placeholder: 'Công ty TNHH ABC' },
            { label: 'Người liên hệ', field: 'contactName' as const, placeholder: 'Nguyễn Văn A' },
            { label: 'Số điện thoại *', field: 'phone' as const, placeholder: '0901234567' },
            { label: 'Email', field: 'email' as const, placeholder: 'contact@company.com' },
            { label: 'Địa chỉ', field: 'address' as const, placeholder: '123 Đường ABC, TP.HCM' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
              <input
                type="text"
                value={form[field] ?? ''}
                onChange={set(field)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#60A61F] focus:ring-2 focus:ring-[#60A61F]/10 outline-none transition-all"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.name || !form.phone}
            className="flex-1 py-2.5 rounded-xl bg-[#60A61F] text-white text-sm font-bold hover:bg-[#4e8c18] transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Trang chính ───────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER'

  const {
    suppliers, loading, searchQuery, setSearchQuery,
    updateSupplier, deleteSupplier, actionLoading, error, setError,
  } = useSuppliers()

  const [editTarget, setEditTarget] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)

  const guavaColors = { primary: '#60A61F', textDark: '#1a4d2e', highlight: '#e65c00' }
  const floatingFruits = [
    { icon: '🍎', pos: 'top-[15%] right-[20%]', delay: '0.5s' },
    { icon: '🍊', pos: 'top-[50%] left-[8%]', delay: '1.2s' },
    { icon: '🥝', pos: 'bottom-[20%] right-[5%]', delay: '2.5s' },
  ]

  async function handleSave(data: SupplierFormData) {
    const ok = await updateSupplier(data)
    if (ok) setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const ok = await deleteSupplier(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  return (
    <div className="fade-up p-6 relative min-h-full z-0 bg-transparent">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(5deg); } }
        .floating-fruit { position: absolute; animation: float 6s ease-in-out infinite; opacity: 0.35; font-size: 2rem; }
        .ft-input:focus { border-color: ${guavaColors.primary}; box-shadow: 0 0 0 3px rgba(96, 166, 31, 0.1); outline: none; }
        .action-btn { transition: all 0.15s ease; }
        .action-btn:hover { transform: scale(1.08); }
      `}</style>

      {/* Lớp nền trái cây */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {floatingFruits.map((fruit, idx) => (
          <span key={idx} className={`floating-fruit ${fruit.pos}`} style={{ animationDelay: fruit.delay }}>{fruit.icon}</span>
        ))}
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          supplier={editTarget}
          onSave={handleSave}
          onCancel={() => { setEditTarget(null); setError(null) }}
          loading={actionLoading}
          error={error}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          supplier={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setError(null) }}
          loading={actionLoading}
        />
      )}

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontFamily: 'var(--font-title)', color: guavaColors.textDark }} className="text-3xl mb-1">
            Nhà cung cấp
          </h1>
          <p className="text-slate-500 text-sm">Quản lý thông tin nhà cung cấp sản phẩm.</p>
        </div>

        {/* BỘ LỌC TÌM KIẾM */}
        <div className="mb-6 relative w-full md:w-1/3">
          <i className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Tìm kiếm nhà cung cấp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ft-input w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm transition-all text-sm"
          />
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-4 px-6">Mã NCC</th>
                  <th className="py-4 px-6">Tên Nhà Cung Cấp</th>
                  <th className="py-4 px-6">Người liên hệ</th>
                  <th className="py-4 px-6">Điện thoại</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Địa chỉ</th>
                  <th className="py-4 px-6">Ngày hợp tác</th>
                  {isManager && <th className="py-4 px-6 text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={isManager ? 8 : 7} className="text-center py-8 text-slate-400">Đang tải dữ liệu...</td></tr>
                ) : suppliers.length === 0 ? (
                  <tr><td colSpan={isManager ? 8 : 7} className="text-center py-8 text-slate-400">Không tìm thấy nhà cung cấp nào.</td></tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-dashed border-slate-100 hover:bg-slate-50/50 transition-colors last:border-0">
                      <td className="py-4 px-6 font-medium text-slate-500">{s.code}</td>
                      <td className="py-4 px-6 font-bold" style={{ color: guavaColors.highlight }}>{s.name}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">{s.contactName}</td>
                      <td className="py-4 px-6 text-slate-600">{s.phone}</td>
                      <td className="py-4 px-6 text-slate-500">{s.email}</td>
                      <td className="py-4 px-6 text-slate-600 truncate max-w-[200px]" title={s.address}>{s.address}</td>
                      <td className="py-4 px-6 text-slate-500">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</td>
                      {isManager && (
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditTarget(s)}
                              className="action-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#60A61F]/10 text-[#4e8c18] text-xs font-semibold hover:bg-[#60A61F]/20 border border-[#60A61F]/20"
                              title="Chỉnh sửa"
                            >
                              <i className="ti ti-edit text-sm"></i>
                              Sửa
                            </button>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              className="action-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 border border-red-100"
                              title="Xóa"
                            >
                              <i className="ti ti-trash text-sm"></i>
                              Xóa
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isManager && (
          <p className="mt-3 text-xs text-slate-400 text-center">
            🔒 Chỉ Quản lý mới có quyền chỉnh sửa hoặc xóa nhà cung cấp.
          </p>
        )}
      </div>
    </div>
  )
}