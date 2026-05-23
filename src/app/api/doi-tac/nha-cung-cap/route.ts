import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const data = suppliers.map(s => ({
      id: s.id,
      code: `NCC${s.id.slice(-4).toUpperCase()}`,
      name: s.name,
      contactName: s.contactName || 'Chưa cập nhật',
      phone: s.phone,
      email: s.email || '-',
      address: s.address || 'Chưa cập nhật',
      createdAt: s.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[GET /api/suppliers] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}