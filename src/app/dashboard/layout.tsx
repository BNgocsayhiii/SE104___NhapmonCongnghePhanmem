'use client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: '📊 Tổng quan', roles: ['MANAGER', 'STAFF_SALES', 'STAFF_WAREHOUSE'] },
  { href: '/dashboard/kho', label: '📦 Quản lý Kho', roles: ['MANAGER', 'STAFF_WAREHOUSE'] },
  { href: '/dashboard/ban-hang', label: '🛒 Bán hàng (POS)', roles: ['MANAGER', 'STAFF_SALES'] },
  { href: '/dashboard/khach-hang', label: '👥 Khách hàng', roles: ['MANAGER', 'STAFF_SALES'] },
  { href: '/dashboard/nha-cung-cap', label: '🚚 Nhà cung cấp', roles: ['MANAGER', 'STAFF_WAREHOUSE'] },
  { href: '/dashboard/bao-cao', label: '📈 Báo cáo', roles: ['MANAGER'] },
  { href: '/dashboard/nhan-vien', label: '👤 Nhân viên', roles: ['MANAGER'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-green-700">🍎 Siêu Thị Trái Cây</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}