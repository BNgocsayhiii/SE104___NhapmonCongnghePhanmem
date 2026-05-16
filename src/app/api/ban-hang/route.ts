import { NextRequest, NextResponse } from 'next/server'
 
export type OrderSource = 'POS' | 'web'
export type OrderStatus = 'Chờ xử lý' | 'Đang xử lý' | 'Hoàn thành' | 'Đã hủy'
 
export interface OrderItem {
  productId: string
  productName: string
  qty: number
  unit: string
  unitPrice: number
  subtotal: number
}
 
export interface Order {
  id: string
  source: OrderSource
  customer: string
  phone?: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  note?: string
  createdAt: string
  updatedAt: string
}
 
const db: Order[] = [
  {
    id:'DH240511', source:'web', customer:'Cô Hồng', phone:'0901 234 567',
    items:[
      { productId:'SP001', productName:'Nho Mẫu Đơn', qty:0.5, unit:'kg', unitPrice:280000, subtotal:140000 },
      { productId:'SP003', productName:'Táo Envy',     qty:0.3, unit:'kg', unitPrice:240000, subtotal:72000 },
    ],
    total:165000, status:'Chờ xử lý', createdAt:'2026-04-23T08:00:00.000Z', updatedAt:'2026-04-23T08:00:00.000Z',
  },
  {
    id:'DH240509', source:'web', customer:'Anh Minh', phone:'0908 765 432',
    items:[
      { productId:'SP002', productName:'Sầu riêng Ri6',     qty:2, unit:'kg', unitPrice:130000, subtotal:260000 },
      { productId:'SP005', productName:'Xoài cát Hòa Lộc', qty:1, unit:'kg', unitPrice:90000,  subtotal:90000 },
    ],
    total:330000, status:'Hoàn thành', createdAt:'2026-04-22T10:00:00.000Z', updatedAt:'2026-04-22T14:00:00.000Z',
  },
]
 
// GET /api/ban-hang — optional ?source=POS|web&status=&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const source = searchParams.get('source') as OrderSource | null
  const status = searchParams.get('status') as OrderStatus | null
  const date = searchParams.get('date')
 
  let result = [...db]
  if (source) result = result.filter(r => r.source === source)
  if (status) result = result.filter(r => r.status === status)
  if (date)   result = result.filter(r => r.createdAt.startsWith(date))
 
  const todayStr = new Date().toISOString().split('T')[0]
  const todayOrders = db.filter(r => r.createdAt.startsWith(todayStr))
 
  return NextResponse.json({
    data: result,
    summary: {
      totalToday: todayOrders.length,
      revenueToday: todayOrders.reduce((s, r) => s + r.total, 0),
      pending: db.filter(r => r.status === 'Chờ xử lý').length,
      completed: db.filter(r => r.status === 'Hoàn thành').length,
    }
  })
}
 
// POST /api/ban-hang — create new order
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { source, customer, phone, items, note } = body
 
  if (!source || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Thiếu thông tin đơn hàng' }, { status: 400 })
  }
 
  const orderItems: OrderItem[] = items.map((item: any) => ({
    productId: item.productId,
    productName: item.productName,
    qty: Number(item.qty),
    unit: item.unit ?? 'kg',
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.qty) * Number(item.unitPrice),
  }))
 
  const total = orderItems.reduce((s, i) => s + i.subtotal, 0)
  const now = new Date().toISOString()
  const newOrder: Order = {
    id: `DH${Date.now()}`,
    source, customer: customer ?? 'Khách lẻ', phone,
    items: orderItems, total,
    status: source === 'POS' ? 'Hoàn thành' : 'Chờ xử lý',
    note, createdAt: now, updatedAt: now,
  }
 
  db.push(newOrder)
  return NextResponse.json({ data: newOrder }, { status: 201 })
}
 
// PATCH /api/ban-hang — update order status
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  const order = db.find(r => r.id === id)
  if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
  order.status = status
  order.updatedAt = new Date().toISOString()
  return NextResponse.json({ data: order })
}