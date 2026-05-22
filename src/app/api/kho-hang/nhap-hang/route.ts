import { NextRequest, NextResponse } from 'next/server'
 
// Types
export type NhapHangStatus = 'Chờ nhập' | 'Nhập một phần' | 'Đã nhập'
 
export interface NhapHang {
  id: string
  supplierId: string
  supplierName: string
  product: string
  qty: number        // kg
  pricePerKg: number // VND
  total: number      // VND
  date: string       // ISO
  note?: string
  status: NhapHangStatus
  createdAt: string
}
 
// --- Mock DB (replace with Prisma / Supabase) ---
const db: NhapHang[] = [
  {
    id: 'NH001', supplierId: 'NCC001', supplierName: 'Vựa Hoa Quả Miền Bắc',
    product: 'Vải thiều Lục Ngạn', qty: 50, pricePerKg: 85000, total: 4250000,
    date: '2026-05-14', status: 'Đã nhập', createdAt: new Date().toISOString(),
  },
  {
    id: 'NH002', supplierId: 'NCC002', supplierName: 'Trái Cây Miền Tây',
    product: 'Xoài cát Hòa Lộc', qty: 30, pricePerKg: 65000, total: 1950000,
    date: '2026-05-13', status: 'Đã nhập', createdAt: new Date().toISOString(),
  },
  {
    id: 'NH003', supplierId: 'NCC003', supplierName: 'Nhập khẩu Thăng Long',
    product: 'Nho Mẫu Đơn', qty: 20, pricePerKg: 210000, total: 4200000,
    date: '2026-05-12', status: 'Chờ nhập', createdAt: new Date().toISOString(),
  },
]
 
// GET /api/nhap-hang  — list, with optional ?status= & ?search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')?.toLowerCase()
 
  let result = [...db]
  if (status) result = result.filter(r => r.status === status)
  if (search) result = result.filter(r =>
    r.product.toLowerCase().includes(search) ||
    r.supplierName.toLowerCase().includes(search)
  )
 
  const summary = {
    total: db.length,
    done: db.filter(r => r.status === 'Đã nhập').length,
    pending: db.filter(r => r.status === 'Chờ nhập').length,
    totalCost: db.reduce((s, r) => s + r.total, 0),
  }
 
  return NextResponse.json({ data: result, summary })
}
 
// POST /api/nhap-hang  — create new phiếu nhập
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { supplierId, supplierName, product, qty, pricePerKg, date, note } = body
 
  if (!supplierName || !product || !qty || !pricePerKg || !date) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }
 
  const newItem: NhapHang = {
    id: `NH${String(db.length + 1).padStart(3, '0')}`,
    supplierId: supplierId ?? '',
    supplierName,
    product,
    qty: Number(qty),
    pricePerKg: Number(pricePerKg),
    total: Number(qty) * Number(pricePerKg),
    date,
    note,
    status: 'Chờ nhập',
    createdAt: new Date().toISOString(),
  }
 
  db.push(newItem)
  return NextResponse.json({ data: newItem }, { status: 201 })
}
 