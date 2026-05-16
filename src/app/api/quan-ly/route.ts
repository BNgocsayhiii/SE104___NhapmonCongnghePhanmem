import { NextRequest, NextResponse } from 'next/server'
 
export interface LoHang {
  id: string
  nhapHangId: string
  product: string
  supplierId: string
  supplierName: string
  imported: number   // kg tổng nhập
  remaining: number  // kg còn lại
  unit: 'kg' | 'thùng' | 'cái'
  costPerUnit: number
  sellPerUnit: number
  importDate: string // ISO
  expiryDate: string // ISO
  note?: string
  createdAt: string
}
 
// Mock DB
const db: LoHang[] = [
  { id:'LH001', nhapHangId:'NH001', product:'Vải thiều Lục Ngạn', supplierId:'NCC001', supplierName:'Vựa Miền Bắc',   imported:50, remaining:5,  unit:'kg', costPerUnit:85000,  sellPerUnit:110000, importDate:'2026-05-14', expiryDate:'2026-05-17', createdAt: new Date().toISOString() },
  { id:'LH002', nhapHangId:'NH002', product:'Xoài cát Hòa Lộc',   supplierId:'NCC002', supplierName:'Trái Cây Miền Tây', imported:30, remaining:12, unit:'kg', costPerUnit:65000,  sellPerUnit:90000,  importDate:'2026-05-13', expiryDate:'2026-05-20', createdAt: new Date().toISOString() },
  { id:'LH003', nhapHangId:'NH003', product:'Nho Mẫu Đơn',         supplierId:'NCC003', supplierName:'Nhập khẩu TL',    imported:20, remaining:20, unit:'kg', costPerUnit:210000, sellPerUnit:280000, importDate:'2026-05-12', expiryDate:'2026-05-25', createdAt: new Date().toISOString() },
]
 
// GET /api/quan-ly  — optional ?expiring=1 for batches expiring ≤3 days
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const expiring = searchParams.get('expiring') === '1'
  const search = searchParams.get('search')?.toLowerCase()
 
  const now = Date.now()
  let result = [...db]
 
  if (expiring) result = result.filter(r => {
    const days = (new Date(r.expiryDate).getTime() - now) / 86400000
    return days <= 3
  })
 
  if (search) result = result.filter(r =>
    r.product.toLowerCase().includes(search) ||
    r.supplierName.toLowerCase().includes(search)
  )
 
  const summary = {
    total: db.length,
    expiringCount: db.filter(r => (new Date(r.expiryDate).getTime() - now) / 86400000 <= 3).length,
    lowStock: db.filter(r => r.remaining / r.imported < 0.2).length,
    totalRemaining: db.reduce((s, r) => s + r.remaining, 0),
  }
 
  return NextResponse.json({ data: result, summary })
}
 
// PATCH /api/quan-ly  — update remaining stock (e.g. after sale)
export async function PATCH(req: NextRequest) {
  const { id, remaining } = await req.json()
  const item = db.find(r => r.id === id)
  if (!item) return NextResponse.json({ error: 'Không tìm thấy lô hàng' }, { status: 404 })
  if (remaining < 0 || remaining > item.imported) {
    return NextResponse.json({ error: 'Số lượng không hợp lệ' }, { status: 400 })
  }
  item.remaining = remaining
  return NextResponse.json({ data: item })
}