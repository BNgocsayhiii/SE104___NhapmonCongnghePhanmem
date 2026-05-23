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

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch('/api/doi-tac/nha-cung-cap')
        const json = await res.json()
        if (json.success) setSuppliers(json.data)
      } catch (error) {
        console.error('Failed to fetch suppliers', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSuppliers()
  }, [])

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
    setSearchQuery 
  }
}