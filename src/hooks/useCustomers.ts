import { useState, useEffect, useMemo } from 'react'

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  points: number;
  totalSpent: number;
  createdAt: string;
}

export interface CustomerFormData {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchCustomers() {
    setLoading(true)
    try {
      const res = await fetch('/api/doi-tac/khach-hang')
      const json = await res.json()
      if (json.success) setCustomers(json.data)
    } catch (err) {
      console.error('Failed to fetch customers', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  async function createCustomer(data: CustomerFormData): Promise<boolean> {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/doi-tac/khach-hang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Lỗi tạo khách hàng'); return false }
      await fetchCustomers()
      return true
    } catch {
      setError('Lỗi kết nối')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  async function updateCustomer(data: CustomerFormData): Promise<boolean> {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/doi-tac/khach-hang', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Lỗi cập nhật'); return false }
      await fetchCustomers()
      return true
    } catch {
      setError('Lỗi kết nối')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  async function deleteCustomer(id: string): Promise<boolean> {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/doi-tac/khach-hang?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Lỗi xóa khách hàng'); return false }
      await fetchCustomers()
      return true
    } catch {
      setError('Lỗi kết nối')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const lowerQuery = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery)
    );
  }, [customers, searchQuery]);

  return {
    customers: filteredCustomers,
    loading,
    searchQuery,
    setSearchQuery,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    actionLoading,
    error,
    setError,
  }
}