import { useState, useEffect, useMemo } from 'react'

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface SupplierFormData {
  id?: string;
  name: string;
  contactName?: string;
  phone: string;
  email?: string;
  address?: string;
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const res = await fetch('/api/doi-tac/nha-cung-cap')
      const json = await res.json()
      if (json.success) setSuppliers(json.data)
    } catch (err) {
      console.error('Failed to fetch suppliers', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuppliers() }, [])

  async function createSupplier(data: SupplierFormData): Promise<boolean> {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/doi-tac/nha-cung-cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Lỗi tạo nhà cung cấp'); return false }
      await fetchSuppliers()
      return true
    } catch {
      setError('Lỗi kết nối')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  async function updateSupplier(data: SupplierFormData): Promise<boolean> {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/doi-tac/nha-cung-cap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Lỗi cập nhật'); return false }
      await fetchSuppliers()
      return true
    } catch {
      setError('Lỗi kết nối')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  async function deleteSupplier(id: string): Promise<boolean> {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/doi-tac/nha-cung-cap?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Lỗi xóa nhà cung cấp'); return false }
      await fetchSuppliers()
      return true
    } catch {
      setError('Lỗi kết nối')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const lowerQuery = searchQuery.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.contactName.toLowerCase().includes(lowerQuery) ||
      s.phone.includes(lowerQuery)
    );
  }, [suppliers, searchQuery]);

  return {
    suppliers: filteredSuppliers,
    loading,
    searchQuery,
    setSearchQuery,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    actionLoading,
    error,
    setError,
  }
}