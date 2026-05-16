import { NextRequest, NextResponse } from 'next/server'
 
export type ProductCategory = 'Trái cây nhập khẩu' | 'Trái cây nhiệt đới' | 'Trái cây có múi' | 'Trái cây miền núi'
 
export interface SanPham {
  id: string
  name: string
  category: ProductCategory
  icon: string
  unit: 'kg' | 'thùng' | 'cái'
  sellPrice: number
  stock: number
  minStock: number
  origin: string
  description?: string
  createdAt: string
}
 
const db: SanPham[] = [
  { id:'SP001', name:'Nho Mẫu Đơn',       category:'Trái cây nhập khẩu', icon:'🍇', unit:'kg', sellPrice:280000, stock:20, minStock:5,  origin:'Hàn Quốc',    createdAt: new Date().toISOString() },
  { id:'SP002', name:'Sầu riêng Ri6',      category:'Trái cây nhiệt đới', icon:'🍈', unit:'kg', sellPrice:130000, stock:6,  minStock:8,  origin:'Tiền Giang',  createdAt: new Date().toISOString() },
  { id:'SP003', name:'Táo Envy',           category:'Trái cây nhập khẩu', icon:'🍎', unit:'kg', sellPrice:240000, stock:15, minStock:5,  origin:'New Zealand', createdAt: new Date().toISOString() },
  { id:'SP004', name:'Bưởi da xanh',       category:'Trái cây có múi',    icon:'🍐', unit:'kg', sellPrice:55000,  stock:30, minStock:10, origin:'Bến Tre',     createdAt: new Date().toISOString() },
  { id:'SP005', name:'Xoài cát Hòa Lộc',  category:'Trái cây nhiệt đới', icon:'🥭', unit:'kg', sellPrice:90000,  stock:12, minStock:5,  origin:'Tiền Giang',  createdAt: new Date().toISOString() },
  { id:'SP006', name:'Vải thiều Lục Ngạn', category:'Trái cây miền núi',  icon:'🍒', unit:'kg', sellPrice:110000, stock:5,  minStock:10, origin:'Bắc Giang',   createdAt: new Date().toISOString() },
]
 
// GET /api/kho-san-pham  — optional ?category=&search=&lowStock=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')?.toLowerCase()
  const lowStock = searchParams.get('lowStock') === '1'
 
  let result = [...db]
  if (category) result = result.filter(r => r.category === category)
  if (search) result = result.filter(r => r.name.toLowerCase().includes(search) || r.origin.toLowerCase().includes(search))
  if (lowStock) result = result.filter(r => r.stock < r.minStock)
 
  return NextResponse.json({
    data: result,
    summary: {
      total: db.length,
      lowStock: db.filter(r => r.stock < r.minStock).length,
      outOfStock: db.filter(r => r.stock === 0).length,
    }
  })
}
 
// POST /api/kho-san-pham  — add new product
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, category, icon, unit, sellPrice, stock, minStock, origin, description } = body
 
  if (!name || !category || !sellPrice) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }
 
  const newProduct: SanPham = {
    id: `SP${String(db.length + 1).padStart(3, '0')}`,
    name, category, icon: icon ?? '🍑', unit: unit ?? 'kg',
    sellPrice: Number(sellPrice), stock: Number(stock ?? 0),
    minStock: Number(minStock ?? 5), origin: origin ?? '',
    description, createdAt: new Date().toISOString(),
  }
 
  db.push(newProduct)
  return NextResponse.json({ data: newProduct }, { status: 201 })
}
 
// PATCH /api/kho-san-pham  — update stock or price
export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json()
  const item = db.find(r => r.id === id)
  if (!item) return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })
  Object.assign(item, updates)
  return NextResponse.json({ data: item })
}