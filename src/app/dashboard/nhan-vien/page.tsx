'use client'
import { useEffect, useState } from 'react'

type User = {
  id: string
  username: string
  fullName: string
  phone: string | null
  role: string
  status: string
  createdAt: string
}

export default function NhanVienPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      setUsers(data)
      setLoading(false)
    })
  }, [])

  const roleLabel = (role: string) => ({
    MANAGER: '🔑 Quản lý',
    STAFF_SALES: '🛒 Bán hàng',
    STAFF_WAREHOUSE: '📦 Thủ kho',
  }[role] || role)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhân viên</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
          + Thêm nhân viên
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">Họ tên</th>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">SĐT</th>
              <th className="px-6 py-3 text-left">Vai trò</th>
              <th className="px-6 py-3 text-left">Trạng thái</th>
              <th className="px-6 py-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Đang tải...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{u.fullName}</td>
                <td className="px-6 py-4 text-gray-500">{u.username}</td>
                <td className="px-6 py-4 text-gray-500">{u.phone || '—'}</td>
                <td className="px-6 py-4">{roleLabel(u.role)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                  }`}>
                    {u.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-500 hover:underline text-xs mr-3">Sửa</button>
                  <button className="text-red-400 hover:underline text-xs">Vô hiệu hóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}