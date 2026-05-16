'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard',              icon: '◈', label: 'Tổng quan' },
    { href: '/dashboard/nhap-hang',    icon: '⬡', label: 'Nhập hàng' },
    { href: '/dashboard/quan-ly',      icon: '▦', label: 'Quản lý' },
    { href: '/dashboard/kho-san-pham', icon: '◉', label: 'Kho sản phẩm' },
    { href: '/dashboard/huy-hang',     icon: '△', label: 'Hủy hàng' },
    { href: '/dashboard/ban-hang',     icon: '▣', label: 'Bán hàng' },
    { href: '/dashboard/nha-cung-cap', icon: '⬟', label: 'Nhà cung cấp' },
    { href: '/dashboard/khach-hang',   icon: '◫', label: 'Khách hàng' },
  ]

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: '#f0ede8',
        fontFamily: "'Instrument Sans', 'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,500&display=swap');

        :root {
          --green-deep: #1c3a28;
          --green-mid: #2d6a45;
          --green-bright: #3d8c5a;
          --green-soft: #e8f2ec;
          --amber: #c8873a;
          --cream: #f7f3ee;
          --sand: #e8e2d8;
          --text-primary: #1c2b1e;
          --text-muted: #7a8c7e;
          --border: rgba(28, 58, 40, 0.08);
        }

        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { scrollbar-width: none; }

        .sidebar {
          width: 230px;
          min-width: 230px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e8f0eb;
          overflow: hidden;
        }

        .logo-area {
          padding: 24px 20px 20px;
          border-bottom: 1px solid #eef3ec;
        }

        .logo-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #3d8c5a 0%, #2d6a45 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          box-shadow: 0 4px 14px rgba(61,140,90,0.35);
          flex-shrink: 0;
        }

        .logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 19px;
          font-weight: 700;
          color: #1a4d2e;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .logo-name span { color: var(--amber); font-style: italic; }

        .logo-tagline {
          font-size: 9px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 3px;
        }

        .nav-area {
          flex: 1;
          overflow-y: auto;
          padding: 12px 12px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: all 0.18s ease;
          margin-bottom: 2px;
          position: relative;
        }

        .nav-link:hover {
          background: rgba(74,155,92,0.07);
          color: #4a9b5c;
        }

        .nav-link.active {
          background: #4a9b5c;
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(74,155,92,0.2);
        }

        .nav-icon {
          font-size: 11px;
          width: 18px;
          text-align: center;
          opacity: 0.65;
          flex-shrink: 0;
        }

        .nav-link.active .nav-icon { opacity: 1; }

        .sidebar-footer {
          padding: 14px;
          border-top: 1px solid #eef3ec;
        }

        .store-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(61,140,90,0.10);
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .status-dot {
          width: 7px; height: 7px;
          background: #4ade80;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(74,222,128,0.6);
          animation: pulse-dot 2.5s ease infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        .store-info p:first-child { font-size: 11px; color: #1a4d2e; font-weight: 600; }
        .store-info p:last-child { font-size: 10px; color: #94a3b8; margin-top: 1px; }

        .user-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 11px;
          background: #f8faf7;
          border: 1px solid #eef3ec;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .user-card:hover { background: #eef5f0; }

        .user-avatar {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #3d8c5a, #c8873a);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0;
        }

        .user-meta p:first-child { font-size: 10px; color: #94a3b8; line-height: 1; }
        .user-meta p:last-child { font-size: 12px; font-weight: 600; color: #1a4d2e; margin-top: 2px; }

        .logout-btn {
          background: none; border: none; color: #cbd5e1;
          cursor: pointer; display: flex; align-items: center;
          padding: 4px; border-radius: 6px; transition: color 0.15s, background 0.15s;
        }
        .logout-btn:hover { color: #f87171; background: rgba(248,113,113,0.1); }

        .main-area {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; background: var(--cream);
        }

        .main-topbar {
          padding: 18px 28px 0;
          display: flex; align-items: center; justify-content: flex-end; gap: 10px;
        }

        .topbar-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px;
          background: white; border: 1px solid var(--sand);
          border-radius: 20px; font-size: 11.5px; font-weight: 500; color: var(--text-muted);
        }

        .topbar-chip .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green-bright); }

        .content-area {
          flex: 1; overflow-y: auto; padding: 22px 28px 28px;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-area">
          <Link href="/dashboard" className="logo-mark">
            <div className="logo-icon">🍃</div>
            <div>
              <div className="logo-name">Frui<span>Track</span></div>
              <div className="logo-tagline">Fruit inventory system</div>
            </div>
          </Link>
        </div>

        <nav className="nav-area hide-scroll">
          {navItems.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="store-status">
            <div className="status-dot" />
            <div className="store-info">
              <p>Cửa hàng đang hoạt động</p>
              <p>Mở cửa 08:00 – 22:00</p>
            </div>
          </div>
          <div className="user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div className="user-avatar">🌿</div>
              <div className="user-meta">
                <p>Đã đăng nhập</p>
                <p>admin</p>
              </div>
            </div>
            <button className="logout-btn" title="Đăng xuất">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-area">
        <div className="main-topbar">
          <div className="topbar-chip">
            <span className="dot" />
            <span>FruiTrack v2.0</span>
          </div>
          <div className="topbar-chip">
            <span>📅</span>
            <span>{new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="content-area hide-scroll">
          {children}
        </div>
      </main>
    </div>
  )
}
