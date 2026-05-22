import { NextRequest, NextResponse } from 'next/server'
 
export type SupplierType = 'Trong nước' | 'Nhập khẩu'
 
export interface NhaCungCap {
  id: string
  name: string
  contact: string
  phone: string
  email?: string
  address: string
  type: SupplierType
  products: string   // comma-separated product names
  totalOrders: number
  totalSpend: number // VND
  rating: number     // 1-5
  note?: string
  active: boolean
  createdAt: string
}
 
const db: NhaCungCap[] = [
  { id:'NCC001', name:'Vựa Hoa Quả Miền Bắc', contact:'Anh Hùng', phone:'024 3456 7890', email:'vnmb@email.com', address:'Hà Nội',    type:'Trong nước', products:'Vải thiều, Đào, Mận', totalOrders:12, totalSpend:28500000, rating:4.8, active:true, createdAt:new Date().toISOString() },
  { id:'NCC002', name:'Trái Cây Miền Tây',     contact:'Chị Lan',  phone:'0270 1234567',  email:'tcmt@email.com', address:'Tiền Giang',type:'Trong nước', products:'Xoài, Sầu riêng, Bưởi', totalOrders:8, totalSpend:18900000, rating:4.5, active:true, createdAt:new Date().toISOString() },
  { id:'NCC003', name:'Nhập Khẩu Thăng Long',  contact:'Anh Đức',  phone:'024 9876 5432', email:'nktl@email.com', address:'Hà Nội',    type:'Nhập khẩu', products:'Nho, Táo, Lê ngoại', totalOrders:5, totalSpend:42000000, rating:4.9, active:true, createdAt:new Date().toISOString() },
]
 
// GET /api/nha-cung-cap — optional ?type=&search=&active=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as SupplierType | null
  const search = searchParams.get('search')?.toLowerCase()
  const activeOnly = searchParams.get('active') === '1'
 
  let result = [...db]
  if (type) result = result.filter(r => r.type === type)
  if (search) result = result.filter(r => r.name.toLowerCase().includes(search) || r.products.toLowerCase().includes(search))
  if (activeOnly) result = result.filter(r => r.active)
 
  return NextResponse.json({
    data: result,
    summary: {
      total: db.length,
      domestic: db.filter(r => r.type === 'Trong nước').length,
      imported: db.filter(r => r.type === 'Nhập khẩu').length,
      totalSpend: db.reduce((s, r) => s + r.totalSpend, 0),
    }
  })
}
 
// POST /api/nha-cung-cap — add supplier
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, contact, phone, email, address, type, products, note } = body
 
  if (!name || !contact || !phone) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }
 
  const newSupplier: NhaCungCap = {
    id: `NCC${String(db.length + 1).padStart(3, '0')}`,
    name, contact, phone, email, address: address ?? '',
    type: type ?? 'Trong nước', products: products ?? '',
    totalOrders: 0, totalSpend: 0, rating: 5,
    note, active: true, createdAt: new Date().toISOString(),
  }
 
  db.push(newSupplier)
  return NextResponse.json({ data: newSupplier }, { status: 201 })
}
 
// PATCH /api/nha-cung-cap — update supplier info
export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json()
  const item = db.find(r => r.id === id)
  if (!item) return NextResponse.json({ error: 'Không tìm thấy nhà cung cấp' }, { status: 404 })
  Object.assign(item, updates)
  return NextResponse.json({ data: item })
}