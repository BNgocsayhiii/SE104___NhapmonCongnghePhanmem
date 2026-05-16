'use client'
import React, { useState } from 'react'
 
const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
  .input-field { border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; width:100%; outline:none; transition:border .15s; font-family:inherit; }
  .input-field:focus { border-color:#4a9b5c; box-shadow:0 0 0 3px rgba(74,155,92,.1); }
  .btn-primary { background:#4a9b5c; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
  .btn-primary:hover { background:#3d8c5a; }
  .product-item:hover { background:#f8faf7; border-color:#c6deca; }
  .cart-item { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f5f9; }
  .cart-item:last-child { border-bottom:none; }
`
 
const products = [
  { id:'SP001', name:'Nho Mẫu Đơn',       price:280000, icon:'🍇', unit:'kg', stock:20 },
  { id:'SP002', name:'Sầu riêng Ri6',      price:130000, icon:'🍈', unit:'kg', stock:6 },
  { id:'SP003', name:'Táo Envy',           price:240000, icon:'🍎', unit:'kg', stock:15 },
  { id:'SP004', name:'Bưởi da xanh',       price:55000,  icon:'🍐', unit:'kg', stock:30 },
  { id:'SP005', name:'Xoài cát Hòa Lộc',  price:90000,  icon:'🥭', unit:'kg', stock:12 },
  { id:'SP006', name:'Vải thiều Lục Ngạn', price:110000, icon:'🍒', unit:'kg', stock:5 },
]
 
const webOrders = [
  { id:'DH240511', customer:'Cô Hồng',  phone:'0901 234 567', date:'23/04/2026', total:165000, status:'Chờ xử lý', items:'Nho Mẫu Đơn 0.5kg, Táo Envy 0.3kg' },
  { id:'DH240510', customer:'Khách lẻ', phone:'—',            date:'23/04/2026', total:96000,  status:'Chờ xử lý', items:'Bưởi da xanh 1.5kg' },
  { id:'DH240509', customer:'Anh Minh', phone:'0908 765 432', date:'22/04/2026', total:330000, status:'Hoàn thành', items:'Sầu riêng Ri6 2kg, Xoài 1kg' },
]
 
type CartItem = { id: string; name: string; icon: string; price: number; qty: number }
 
export default function BanHangPage() {
  const [tab, setTab] = useState<'pos' | 'web'>('pos')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState('')
 
  const addToCart = (p: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id)
      if (existing) return prev.map(c => c.id === p.id ? {...c, qty: c.qty + 0.5} : c)
      return [...prev, { id: p.id, name: p.name, icon: p.icon, price: p.price, qty: 0.5 }]
    })
  }
 
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id))
 
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
 
  const badgeStyle = (s: string) => s === 'Chờ xử lý'
    ? 'bg-amber-100 text-amber-600'
    : 'bg-emerald-100 text-emerald-600'
 
  return (
    <div>
      <style>{pageStyle}</style>
 
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#1a4d2e] mb-0.5">Bán hàng</h1>
          <p className="text-slate-400 text-xs">Bán tại quầy (POS) và quản lý đơn hàng online</p>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button onClick={() => setTab('pos')} className={`px-5 py-2.5 text-sm font-semibold transition-colors ${tab === 'pos' ? 'bg-[#4a9b5c] text-white' : 'text-slate-500'}`}>
            🖥️ Bán tại quầy
          </button>
          <button onClick={() => setTab('web')} className={`px-5 py-2.5 text-sm font-semibold transition-colors ${tab === 'web' ? 'bg-[#4a9b5c] text-white' : 'text-slate-500'}`}>
            🛒 Đơn web
          </button>
        </div>
      </div>
 
      {tab === 'pos' ? (
        <div className="grid grid-cols-5 gap-5">
          {/* Product grid - 3/5 */}
          <div className="col-span-3">
            <input className="input-field mb-4" placeholder="🔍  Tìm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="product-item bg-white border border-slate-100 rounded-xl p-4 text-left transition-all cursor-pointer"
                  style={{ fontFamily: 'inherit' }}>
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <p className="text-sm font-bold text-[#1a4d2e] leading-tight">{p.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Còn {p.stock} {p.unit}</p>
                  <p className="text-sm font-bold text-[#4a9b5c] mt-2">{p.price.toLocaleString()} ₫/{p.unit}</p>
                </button>
              ))}
            </div>
          </div>
 
          {/* Cart - 2/5 */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1a4d2e]">Giỏ hàng</h3>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600">Xóa tất cả</button>
                )}
              </div>
 
              <input className="input-field mb-4" placeholder="Tên khách hàng (tùy chọn)" value={customer} onChange={e => setCustomer(e.target.value)} />
 
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-300">
                  <p className="text-4xl mb-2">🛒</p>
                  <p className="text-sm">Chưa có sản phẩm nào</p>
                </div>
              ) : (
                <div>
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-[#1a4d2e]">{item.name}</p>
                          <p className="text-[11px] text-slate-400">{item.qty} kg × {item.price.toLocaleString()} ₫</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-[#1a4d2e]">{(item.price * item.qty).toLocaleString()} ₫</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-400 text-lg leading-none">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
 
              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-500">Tổng cộng</span>
                    <span className="text-xl font-bold text-[#1a4d2e]">{subtotal.toLocaleString()} ₫</span>
                  </div>
                  <button className="btn-primary w-full py-3 text-base">
                    ✓ Thanh toán
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Web orders tab */
        <div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label:'Đơn hôm nay', value:'0', icon:'📦', color:'#4a9b5c' },
              { label:'Chờ xử lý',   value:'2', icon:'🕒', color:'#d97706' },
              { label:'Hoàn thành',  value:'1', icon:'✅', color:'#16a34a' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
                  <p className="text-xl font-bold text-[#1a4d2e]">{s.value}</p>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ background: `${s.color}15` }}>{s.icon}</div>
              </div>
            ))}
          </div>
 
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-[#1a4d2e]">Danh sách đơn hàng web</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {webOrders.map(order => (
                <div key={order.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-[#1a4d2e]">{order.id}</p>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${badgeStyle(order.status)}`}>{order.status}</span>
                      </div>
                      <p className="text-sm text-slate-500">{order.customer} · {order.phone}</p>
                      <p className="text-xs text-slate-400 mt-1">{order.items}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1a4d2e]">{order.total.toLocaleString()} ₫</p>
                      <p className="text-xs text-slate-400 mt-1">{order.date}</p>
                      {order.status === 'Chờ xử lý' && (
                        <button className="btn-primary mt-2 text-xs py-1.5 px-3">Xác nhận</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}