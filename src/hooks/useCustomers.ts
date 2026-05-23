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

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('/api/doi-tac/khach-hang')
        const json = await res.json()
        if (json.success) setCustomers(json.data)
      } catch (error) {
        console.error('Failed to fetch customers', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  // Tự động lọc danh sách theo từ khóa tìm kiếm
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
    setSearchQuery 
  }
}