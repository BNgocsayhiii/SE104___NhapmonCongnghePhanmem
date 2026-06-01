'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error)
        return
      }

      // 🌟 ĐÃ SỬA: Phân quyền điều hướng sau khi đăng nhập thành công
      const userRole = data.user?.role;
      
      if (userRole === 'STAFF_SALES') {
        router.push('/dashboard/ban-hang/tao-hoa-don');
      } else if (userRole === 'STAFF_WAREHOUSE') {
        router.push('/dashboard/kho-hang/quan-ly');
      } else {
        // Mặc định MANAGER sẽ vào trang Tổng quan
        router.push('/dashboard');
      }
      
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden" style={{ background: '#f4f9f0', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Google Fonts & Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        /* Input Styles */
        .fruitrack-input {
          width: 100%;
          height: 46px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 0 44px 0 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1a4d2e;
          background: #f8faf7;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .fruitrack-input:focus {
          border-color: #4a9b5c;
          background: #fff;
        }
        .fruitrack-input::placeholder { color: #9ca3af; }

        /* Animations */
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .fruit-float { animation: floatBadge 4s ease-in-out infinite; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }

        /* Synchronized Logo Styles */
        .logo-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          user-select: none;
        }

        .logo-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #ecfdf5 0%, #bbf7d0 55%, #4ade80 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 6px 18px rgba(34,197,94,0.18);
          flex-shrink: 0;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          gap: 0px;
        }

        .logo-name {
          font-family: var(--font-title);
          font-size: 20px;
          font-weight: 700;
          color: #1a4d2e;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .logo-name span {
          color: #c8873a;
          font-style: italic;
        }

        .logo-tagline {
          font-size: 9.5px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 3px;
        }
      `}</style>

      {/* Background decorations */}
      <div className="absolute pointer-events-none rounded-full" style={{ width: 260, height: 260, background: '#4a9b5c', opacity: 0.12, top: -80, left: -80 }} />
      <div className="absolute pointer-events-none rounded-full" style={{ width: 180, height: 180, background: '#f97316', opacity: 0.13, bottom: -50, right: -40 }} />
      <div className="absolute pointer-events-none rounded-full" style={{ width: 90, height: 90, background: '#facc15', opacity: 0.15, top: 60, right: 60 }} />
      <div className="absolute pointer-events-none rounded-full" style={{ width: 50, height: 50, background: '#ef4444', opacity: 0.1, bottom: 80, left: 80 }} />

      {/* Squiggles */}
      <svg className="absolute pointer-events-none" style={{ top: 10, left: 120, opacity: 0.18 }} width="120" height="60" viewBox="0 0 120 60" fill="none">
        <path d="M0,30 C20,5 40,55 60,30 C80,5 100,55 120,30" stroke="#4a9b5c" strokeWidth="2.5"/>
      </svg>
      <svg className="absolute pointer-events-none" style={{ bottom: 30, right: 100, opacity: 0.18 }} width="100" height="50" viewBox="0 0 100 50" fill="none">
        <path d="M0,25 C16,5 34,45 50,25 C66,5 84,45 100,25" stroke="#4a9b5c" strokeWidth="2.5"/>
      </svg>

      {/* Topbar with Synchronized Logo */}
      <div className="relative z-10 flex items-center justify-center px-7 py-5 mt-4">
        <div className="logo-mark">
          <div className="logo-icon">
            <img src="/favicon.ico" alt="logo" width={80} height={80} />
          </div>
          <div className="logo-text">
            <div className="logo-name">Frui<span>Track</span></div>
            <div className="logo-tagline">Fruit inventory system</div>
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">
        <div className="fade-up w-full bg-white" style={{ maxWidth: 400, borderRadius: 20, padding: '40px 36px 32px', border: '0.5px solid rgba(74,155,92,0.15)' }}>

          {/* Fruit badges */}
          <div className="fruit-float flex justify-center gap-2 mb-5">
            {[['🍋','#fef3c7'],['🍓','#fee2e2'],['🥝','#d1fae5'],['🍊','#fff7ed']].map(([emoji, bg], i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {emoji}
              </div>
            ))}
          </div>

          {/* Pill tag */}
          <div className="mb-1 text-center">
            <span style={{ display: 'inline-block', background: '#f0faf3', color: '#4a9b5c', fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 99, border: '0.5px solid #c6e8d0', letterSpacing: '0.06em' }}>
              QUẢN LÝ CỬA HÀNG
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 26, color: '#1a4d2e', textAlign: 'center', marginBottom: 6 }}>
            Đăng nhập
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.6, fontWeight: 300 }}>
            Nhập thông tin để truy cập<br />vào hệ thống fruitrack
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Error */}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a9b5c', marginBottom: 6 }}>
                Tên đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="fruitrack-input"
                  type="text"
                  placeholder="Nhập username..."
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#9ca3af', pointerEvents: 'none' }}>👤</span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a9b5c', marginBottom: 6 }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="fruitrack-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: 54 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', fontFamily: 'inherit', fontWeight: 500, padding: 4 }}
                >
                  {showPass ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 48, background: loading ? '#9ca3af' : '#1a4d2e',
                color: '#fff', border: 'none', borderRadius: 12, fontSize: 15,
                fontWeight: 500, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, marginTop: 8
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#4a9b5c' }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#1a4d2e' }}
            >
              {loading ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-5 text-center" style={{ fontSize: 11, color: '#9ca3af' }}>
        Copyright © 2026 FruiTrack — Quản lý trái cây thông minh
      </div>
    </div>
  )
}