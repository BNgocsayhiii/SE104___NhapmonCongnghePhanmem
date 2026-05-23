'use client'
import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// ─── Constants & Types ────────────────────────────────────────────────────────
const ROLES = {
  MANAGER: 'MANAGER',
  STAFF_SALES: 'STAFF_SALES',
  STAFF_WAREHOUSE: 'STAFF_WAREHOUSE'
}

const PERMISSION_MAP: Record<string, string[]> = {
  '/dashboard': [ROLES.MANAGER],
  '/dashboard/kho-hang/nhap-hang': [ROLES.MANAGER, ROLES.STAFF_WAREHOUSE],
  '/dashboard/kho-hang/huy-hang': [ROLES.MANAGER, ROLES.STAFF_WAREHOUSE],
  '/dashboard/kho-hang/quan-ly': [ROLES.MANAGER, ROLES.STAFF_WAREHOUSE],
  '/dashboard/ban-hang/tao-hoa-don': [ROLES.MANAGER, ROLES.STAFF_SALES],
  '/dashboard/ban-hang/lich-su-ban-hang': [ROLES.MANAGER, ROLES.STAFF_SALES],
  '/dashboard/nhan-vien/danh-sach': [ROLES.MANAGER, ROLES.STAFF_SALES, ROLES.STAFF_WAREHOUSE],
  '/dashboard/nhan-vien/ca-lam': [ROLES.MANAGER, ROLES.STAFF_SALES, ROLES.STAFF_WAREHOUSE],
  '/dashboard/doi-tac/nha-cung-cap': [ROLES.MANAGER, ROLES.STAFF_WAREHOUSE],
  '/dashboard/doi-tac/khach-hang': [ROLES.MANAGER, ROLES.STAFF_SALES],
  '/dashboard/tro-ly-ai': [ROLES.MANAGER],
  '/dashboard/bao-cao': [ROLES.MANAGER],
}

const ROLE_LABEL: Record<string, string> = {
  MANAGER: 'Quản lý',
  STAFF_SALES: 'Thu ngân',
  STAFF_WAREHOUSE: 'Thủ kho',
}

interface SubItem { href: string; label: string }
interface NavItem { href: string; icon: string; label: string; single?: boolean; children?: SubItem[] }

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const currentRole = user?.role || ROLES.STAFF_SALES
  
  const [dateStr, setDateStr] = useState('')
  const [greeting, setGreeting] = useState('')
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const hasAccess = (href: string) => {
    if (currentRole === ROLES.MANAGER) return true
    return PERMISSION_MAP[href]?.includes(currentRole) ?? false
  }

  // 1. Cấu hình Menu gốc
  const menuConfig = useMemo((): NavItem[] => [
    { href: '/dashboard', icon: 'ti-layout-dashboard', label: 'Tổng quan', single: true },
    {
      href: '/dashboard/kho-hang', icon: 'ti-building-warehouse', label: 'Kho hàng',
      children: [
        { href: '/dashboard/kho-hang/nhap-hang', label: 'Nhập hàng' },
        { href: '/dashboard/kho-hang/huy-hang', label: 'Hủy hàng' },
        { href: '/dashboard/kho-hang/quan-ly', label: 'Quản lý chung' },
      ],
    },
    {
      href: '/dashboard/ban-hang', icon: 'ti-receipt', label: 'Bán hàng',
      children: [
        { href: '/dashboard/ban-hang/tao-hoa-don', label: 'Tạo hóa đơn' },
        { href: '/dashboard/ban-hang/lich-su-ban-hang', label: 'Lịch sử bán hàng' },
      ],
    },
    {
      href: '/dashboard/nhan-vien', icon: 'ti-users', 
      label: currentRole === ROLES.MANAGER ? 'Nhân viên' : 'Tài khoản',
      children: [
        { href: '/dashboard/nhan-vien/danh-sach', label: currentRole === ROLES.MANAGER ? 'Danh sách nhân viên' : 'Thông tin cá nhân' },
        { href: '/dashboard/nhan-vien/ca-lam', label: 'Ca làm việc' },
      ]
    },
    {
      href: '/dashboard/doi-tac', icon: 'ti-briefcase', label: 'Đối tác',
      children: [
        { href: '/dashboard/doi-tac/nha-cung-cap', label: 'Nhà cung cấp' },
        { href: '/dashboard/doi-tac/khach-hang', label: 'Khách hàng' },
      ],
    },
    { href: '/dashboard/bao-cao', icon: 'ti-chart-bar', label: 'Báo cáo', single: true },
  ], [currentRole])

  // 2. Lọc danh sách menu (tránh lỗi logic tách mảng)
  const navItems = useMemo(() => {
    return menuConfig
      .filter(item => item.single ? hasAccess(item.href) : item.children?.some(c => hasAccess(c.href)))
      .map(item => ({
        ...item,
        children: item.children?.filter(c => hasAccess(c.href))
      }))
  }, [menuConfig])

  // Lấy tiêu đề trang
  const currentTitle = useMemo(() => {
    const flatItems = [...navItems, ...navItems.flatMap(i => i.children || [])];
    const match = flatItems.find(i => i.href === pathname);
    return match?.label || 'Dashboard';
  }, [pathname, navItems]);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }))
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối")
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f3ee', fontFamily: "'Instrument Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      <aside className="ft-sidebar">
        <Link href="/dashboard" className="ft-logo">
          <div className="ft-logo-icon">🍃</div>
          <div className="ft-logo-name">Frui<span>Track</span></div>
        </Link>

        <nav className="ft-nav">
          {navItems.map((item) => (
            <React.Fragment key={item.href}>
              {item.single ? (
                <Link href={item.href} className={`ft-nav-link ${pathname === item.href ? 'active' : ''}`}>
                  <i className={`ti ${item.icon} ni`} /> {item.label}
                </Link>
              ) : (
                <>
                  <button 
                    className={`ft-nav-link ${pathname.includes(item.href) ? 'active' : ''} ${openGroup === item.href ? 'open' : ''}`}
                    onClick={() => setOpenGroup(prev => prev === item.href ? null : item.href)}
                  >
                    <i className={`ti ${item.icon} ni`} /> {item.label}
                    <span className="ft-chevron">▾</span>
                  </button>
                  {openGroup === item.href && (
                    <div className="ft-nav-sub">
                      {item.children?.map(child => (
                        <Link key={child.href} href={child.href} className={`ft-nav-sub-link ${pathname === child.href ? 'active' : ''}`}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </React.Fragment>
          ))}
          
          <div className="ft-nav-divider" />
          {hasAccess('/dashboard/tro-ly-ai') && (
            <Link href="/dashboard/tro-ly-ai" className="ft-ai-btn">
              <div className="ft-ai-dot" />
              <span style={{ flex: 1 }}>Trợ lý AI</span>
              <span className="ft-ai-kbd">⌘K</span>
            </Link>
          )}
        </nav>

        <div className="ft-footer">
          <div className="ft-store-status">
            <div className="ft-status-dot" />
            <div>
              <p>{greeting}</p>
              <p>Mở cửa 07:00 – 22:00</p>
            </div>
          </div>
          <div className="ft-user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="ft-user-avatar">{user?.fullName?.[0]?.toUpperCase() || 'U'}</div>
              <div className="ft-user-meta">
                <p>{user?.role ? ROLE_LABEL[user.role] : '...'}</p>
                <p>{user?.fullName || 'Chưa đăng nhập'}</p>
              </div>
            </div>
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}>
              <i className="ti ti-logout" />
            </button>
          </div>
        </div>
      </aside>

      <main className="ft-main">
        {/* Đã dọn dẹp hoàn toàn ft-topbar cũ để tránh lặp tiêu đề */}
        <div className="ft-content">{children}</div>
      </main>
    </div>
  )
}

const STYLES = `

@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,500&display=swap');

@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');



.ft-sidebar {

  width: 210px; min-width: 210px;

  background: #ffffff;

  border-right: 0.5px solid #e8f0eb;

  display: flex; flex-direction: column;

  font-family: 'Instrument Sans', sans-serif;

}

.ft-logo {

  padding: 18px 16px 14px;

  border-bottom: 0.5px solid #eef3ec;

  display: flex; align-items: center; gap: 9px;

  text-decoration: none;

}

.ft-logo-icon {

  width: 32px; height: 32px;

  background: linear-gradient(135deg, #3d8c5a 0%, #2d6a45 100%);

  border-radius: 9px;

  display: flex; align-items: center; justify-content: center;

  font-size: 16px; flex-shrink: 0;

  box-shadow: 0 3px 10px rgba(61,140,90,0.28);

}

.ft-logo-name {

  font-family: 'Playfair Display', serif;

  font-size: 17px; font-weight: 700;

  color: #1a4d2e; letter-spacing: -0.02em; line-height: 1;

}

.ft-logo-name span { color: #c8873a; font-style: italic; }

.ft-logo-tag {

  font-size: 8.5px; color: #94a3b8; font-weight: 500;

  letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px;

}

.ft-nav {

  flex: 1; overflow-y: auto; padding: 10px;

  scrollbar-width: none;

}

.ft-nav::-webkit-scrollbar { display: none; }

.ft-nav-divider {

  height: 0.5px; background: #eef3ec; margin: 6px 10px;

}

.ft-nav-link {

  display: flex; align-items: center; gap: 8px;

  padding: 7px 10px; border-radius: 8px;

  font-size: 12.5px; font-weight: 500; color: #64748b;

  cursor: pointer; transition: all 0.15s; margin-bottom: 1px;

  position: relative; user-select: none;

  text-decoration: none;

  background: none; border: none; width: 100%; text-align: left;

}

.ft-nav-link:hover { background: rgba(74,155,92,0.07); color: #4a9b5c; }

.ft-nav-link.active {

  background: #4a9b5c; color: white; font-weight: 600;

  box-shadow: 0 3px 10px rgba(74,155,92,0.2);

}

.ft-nav-link .ni {

  font-size: 15px; width: 18px; text-align: center;

  flex-shrink: 0; opacity: 0.7;

}

.ft-nav-link.active .ni { opacity: 1; }

.ft-chevron {

  margin-left: auto; font-size: 10px;

  transition: transform 0.2s; opacity: 0.5;

  display: inline-block;

}

.ft-nav-link.open .ft-chevron { transform: rotate(180deg); }

.ft-nav-sub {

  padding-left: 26px; margin-bottom: 2px; overflow: hidden;

}

.ft-nav-sub-link {

  display: flex; align-items: center; gap: 6px;

  padding: 5px 10px; border-radius: 7px;

  font-size: 11.5px; font-weight: 500; color: #94a3b8;

  cursor: pointer; margin-bottom: 1px; transition: all 0.12s;

  text-decoration: none;

}

.ft-nav-sub-link::before {

  content: ''; width: 4px; height: 4px;

  border-radius: 50%; background: currentColor;

  flex-shrink: 0; opacity: 0.5;

}

.ft-nav-sub-link:hover { color: #4a9b5c; background: rgba(74,155,92,0.05); }

.ft-nav-sub-link.active { color: #4a9b5c; font-weight: 600; }

.ft-ai-btn {

  display: flex; align-items: center; gap: 8px;

  padding: 8px 10px; border-radius: 9px;

  font-size: 12.5px; font-weight: 600; color: #1a4d2e;

  cursor: pointer;

  background: linear-gradient(135deg, rgba(61,140,90,0.1), rgba(200,135,58,0.08));

  border: 0.5px solid rgba(61,140,90,0.2);

  transition: all 0.15s; margin: 0 0 4px;

  text-decoration: none; width: 100%; text-align: left;

}

.ft-ai-btn:hover {

  background: linear-gradient(135deg, rgba(61,140,90,0.17), rgba(200,135,58,0.13));

}

.ft-ai-dot {

  width: 7px; height: 7px; border-radius: 50%;

  background: #c8873a; flex-shrink: 0;

  animation: ft-pulse-ai 2s ease infinite;

  box-shadow: 0 0 5px rgba(200,135,58,0.5);

}

@keyframes ft-pulse-ai {

  0%, 100% { opacity: 1; transform: scale(1); }

  50% { opacity: 0.5; transform: scale(0.8); }

}

.ft-ai-kbd {

  font-size: 9px; background: rgba(255,255,255,0.7);

  border: 0.5px solid rgba(0,0,0,0.1); border-radius: 4px;

  padding: 1px 5px; color: #94a3b8; font-family: monospace;

}

.ft-footer {

  padding: 10px; border-top: 0.5px solid #eef3ec;

}

.ft-store-status {

  display: flex; align-items: center; gap: 7px;

  padding: 6px 10px; background: rgba(74,222,128,0.07);

  border-radius: 7px; margin-bottom: 8px;

}

.ft-status-dot {

  width: 6px; height: 6px; background: #4ade80;

  border-radius: 50%; flex-shrink: 0;

  box-shadow: 0 0 5px rgba(74,222,128,0.6);

  animation: ft-pulse-dot 2.5s ease infinite;

}

@keyframes ft-pulse-dot {

  0%, 100% { opacity: 1; } 50% { opacity: 0.5; }

}

.ft-store-status p { margin: 0; }

.ft-store-status p:first-child { font-size: 10.5px; color: #1a4d2e; font-weight: 600; }

.ft-store-status p:last-child  { font-size: 9.5px; color: #94a3b8; margin-top: 2px; }

.ft-user-card {

  display: flex; align-items: center; justify-content: space-between;

  padding: 7px 10px; background: #f8faf7;

  border: 0.5px solid #eef3ec; border-radius: 9px; cursor: pointer;

  transition: background 0.15s;

}

.ft-user-card:hover { background: #eef5f0; }

.ft-user-avatar {

  width: 26px; height: 26px;

  background: linear-gradient(135deg, #3d8c5a, #c8873a);

  border-radius: 7px; display: flex; align-items: center;

  justify-content: center; font-size: 12px; flex-shrink: 0;

  color: white; font-weight: bold;

}

.ft-user-meta p { margin: 0; }

.ft-user-meta p:first-child { font-size: 9.5px; color: #94a3b8; line-height: 1; }

.ft-user-meta p:last-child   { font-size: 11.5px; font-weight: 600; color: #1a4d2e; margin-top: 2px; }

.ft-main {

  flex: 1; display: flex; flex-direction: column; overflow: hidden;

}

.ft-topbar {

  padding: 14px 22px 0;

  display: flex; align-items: center; justify-content: space-between; gap: 8px;

}

.ft-topbar-right { display: flex; align-items: center; gap: 8px; }

.ft-topbar-chip {

  display: flex; align-items: center; gap: 5px;

  padding: 4px 10px; background: white;

  border: 0.5px solid #e8e2d8; border-radius: 20px;

  font-size: 11px; font-weight: 500; color: #7a8c7e;

  font-family: 'Instrument Sans', sans-serif;

}

.ft-topbar-chip .dot { width: 5px; height: 5px; border-radius: 50%; background: #3d8c5a; }

.ft-content {

  flex: 1; overflow-y: auto; padding: 16px 22px 22px;

  scrollbar-width: none;

}

.ft-content::-webkit-scrollbar { display: none; }

`