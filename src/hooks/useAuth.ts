'use client'

import { useState, useEffect } from 'react'

export interface AuthUser {
  id: string
  username: string
  fullName: string
  role: string
  email?: string
  phone?: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me')
        const json = await res.json()

        // API trả về { user: payload }
        if (res.ok && json.user) {
          setUser(json.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu phiên đăng nhập:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [])

  // Đảm bảo đăng xuất dứt điểm
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error)
    } finally {
      setUser(null)
      // Dùng window.location thay vì router.push để ép trình duyệt load lại từ đầu, xóa mọi cache
      window.location.href = '/login'
    }
  }

  return { user, isLoading, logout }
}
