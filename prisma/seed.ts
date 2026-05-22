import { PrismaClient, BatchStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('⏳ Đang xóa dữ liệu cũ...')
  
  // Xóa theo thứ tự từ bảng con (chứa khóa ngoại) đến bảng cha để tránh lỗi ràng buộc
  await prisma.invoiceItem.deleteMany()
  await prisma.pointTransaction.deleteMany() 
  await prisma.invoice.deleteMany()
  await prisma.stockAdjustment.deleteMany()  
  await prisma.wasteLog.deleteMany()
  await prisma.batch.deleteMany()
  await prisma.importReceipt.deleteMany()
  await prisma.promotion.deleteMany()        
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.session.deleteMany()          
  await prisma.workShift.deleteMany() // 🌟 MỚI: Xóa lịch làm việc cũ
  await prisma.auditLog.deleteMany()  // 🌟 MỚI: Xóa nhật ký hệ thống cũ
  await prisma.user.deleteMany()

  console.log('🌱 Đang tạo dữ liệu mới...')

  // ==========================================
  // 1. TẠO USERS
  // ==========================================
  const defaultPassword = await bcrypt.hash('123456', 10)

  const manager = await prisma.user.create({
    data: { username: 'admin', password: defaultPassword, fullName: 'Nguyễn Quản Lý', phone: '0900000001', role: 'MANAGER', status: 'ACTIVE' },
  })
  const salesStaff = await prisma.user.create({
    data: { username: 'sales01', password: defaultPassword, fullName: 'Trần Thu Ngân', phone: '0900000002', role: 'STAFF_SALES', status: 'ACTIVE' },
  })
  const warehouseStaff = await prisma.user.create({
    data: { username: 'kho01', password: defaultPassword, fullName: 'Lê Thủ Kho', phone: '0900000003', role: 'STAFF_WAREHOUSE', status: 'ACTIVE' },
  })

  // ==========================================
  // 2. TẠO CATEGORIES
  // ==========================================
  const catNoiDia = await prisma.category.create({
    data: { name: 'Nội địa', description: 'Trái cây đặc sản các vùng miền Việt Nam' }
  })
  const catNhapKhau = await prisma.category.create({
    data: { name: 'Nhập khẩu', description: 'Trái cây nhập khẩu trực tiếp bằng đường hàng không/biển' }
  })

  // ==========================================
  // 3. TẠO SUPPLIERS
  // ==========================================
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'CTY Nông Sản Việt', contactName: 'Anh Bình', phone: '0811111111', address: 'Tiền Giang' } }),
    prisma.supplier.create({ data: { name: 'K-Fruit Import', contactName: 'Mr. Lee', phone: '0822222222', address: 'Quận 7, TP.HCM' } }),
  ])

  // ==========================================
  // 4. TẠO PRODUCTS
  // ==========================================
  const productsData = [
    { sku: '89300001', name: 'Táo Rockit New Zealand', unit: 'Ống', currentPrice: 135000, evaporationRate: 0.01, shelfLifeDays: 30, categoryId: catNhapKhau.id },
    { sku: '89300002', name: 'Nho xanh Autumn Crisp Mỹ', unit: 'kg', currentPrice: 280000, evaporationRate: 0.03, shelfLifeDays: 14, categoryId: catNhapKhau.id },
    { sku: '89300003', name: 'Xoài Cát Hòa Lộc', unit: 'kg', currentPrice: 85000, evaporationRate: 0.025, shelfLifeDays: 7, categoryId: catNoiDia.id },
    { sku: '89300004', name: 'Dâu Tây Mộc Châu', unit: 'Hộp', currentPrice: 220000, evaporationRate: 0.04, shelfLifeDays: 4, categoryId: catNoiDia.id },
  ]

  const products = []
  for (const p of productsData) {
    products.push(await prisma.product.create({ data: p }))
  }

  // ==========================================
  // 5. TẠO PROMOTIONS
  // ==========================================
  const today = new Date()
  const promoNearExpiry = await prisma.promotion.create({
    data: {
      name: 'Xả hàng cận date',
      description: 'Giảm 30% cho tất cả trái cây chuẩn bị hết hạn',
      discountPercent: 30,
      applyToStatus: 'NEAR_EXPIRY',
      startDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), 
      endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),  
      isActive: true
    }
  })

  // ==========================================
  // 6. TẠO IMPORT RECEIPTS
  // ==========================================
  const receiptNoiDia = await prisma.importReceipt.create({
    data: { receiptCode: 'PN-2605-001', supplierId: suppliers[0].id, totalAmount: 25000000, receivedById: warehouseStaff.id, note: 'Nhập hàng nội địa' }
  })
  const receiptNhapKhau = await prisma.importReceipt.create({
    data: { receiptCode: 'PN-2605-002', supplierId: suppliers[1].id, totalAmount: 85000000, receivedById: warehouseStaff.id, note: 'Nhập container lạnh' }
  })

  // ==========================================
  // 7. TẠO BATCHES
  // ==========================================
  const batches = []
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const importReceiptId = product.categoryId === catNhapKhau.id ? receiptNhapKhau.id : receiptNoiDia.id
    
    let daysAgo = 1; 
    if (i === 2) daysAgo = 6; // Xoài nhập 6 ngày trước -> shelfLife 7 ngày -> Cận date
    if (i === 3) daysAgo = 5; // Dâu nhập 5 ngày trước -> shelfLife 4 ngày -> Hết hạn

    const packagedAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const expiredAt = new Date(packagedAt.getTime() + product.shelfLifeDays * 24 * 60 * 60 * 1000)
    
    let status: BatchStatus = 'FRESH'
    const daysLeft = (expiredAt.getTime() - today.getTime()) / (1000 * 3600 * 24)
    if (daysLeft < 0) status = 'EXPIRED'
    else if (daysLeft <= 2) status = 'NEAR_EXPIRY'

    const quantity = 100
    const remaining = Math.floor(Math.random() * 50) + 20 
    
    const lossPercentage = product.evaporationRate * daysAgo
    let effectiveRemaining = remaining * (1 - lossPercentage)
    if (effectiveRemaining < 0) effectiveRemaining = 0

    batches.push(
      await prisma.batch.create({
        data: {
          batchCode: `L-2605-${(i+1).toString().padStart(3, '0')}`,
          productId: product.id,
          importReceiptId,
          quantity,
          remaining,
          effectiveRemaining: parseFloat(effectiveRemaining.toFixed(2)), 
          importPrice: product.currentPrice * 0.6,
          packagedAt,
          expiredAt,
          status, 
          createdById: warehouseStaff.id,
        }
      })
    )
  }

  // ==========================================
  // 8. TẠO CUSTOMERS
  // ==========================================
  const customer1 = await prisma.customer.create({ data: { name: 'Phạm Thị Lan', phone: '0987654321', points: 150, address: 'Q3, TP.HCM' } })

  // ==========================================
  // 9. TẠO INVOICES & POINT TRANSACTIONS
  // ==========================================
  // Đơn hàng 1: Mua bình thường tại quầy (Không khuyến mãi)
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceCode: 'INV-001', customerId: customer1.id, createdById: salesStaff.id, channel: 'POS', paymentMethod: 'QR', status: 'PAID',
      totalAmount: 270000, discountPercent: 0, discount: 0, pointsUsed: 0, finalAmount: 270000,
      items: {
        create: [
          { 
            productId: products[0].id, 
            batchId: batches[0].id, 
            quantity: 2, 
            unitPrice: products[0].currentPrice, 
            subtotal: products[0].currentPrice * 2,
            discountAmount: 0 
          }
        ]
      }
    }
  })
  
  await prisma.pointTransaction.create({
    data: { customerId: customer1.id, invoiceId: invoice1.id, delta: 27, reason: 'Tích điểm mua hàng INV-001' }
  })

  // Đơn hàng 2: Đặt hàng Online tiêu điểm tích lũy
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceCode: 'INV-002', customerId: customer1.id, createdById: null, channel: 'ONLINE', paymentMethod: 'BANK_TRANSFER', status: 'DELIVERED',
      shippingAddress: 'Tòa nhà Bitexco, Q1', shippingFee: 30000, trackingCode: 'GHTK-9999',
      totalAmount: 280000, discountPercent: 0, discount: 50000, pointsUsed: 50, finalAmount: 260000, 
      items: {
        create: [
          { 
            productId: products[1].id, 
            batchId: batches[1].id, 
            quantity: 1, 
            unitPrice: products[1].currentPrice, 
            subtotal: products[1].currentPrice * 1,
            discountAmount: 0
          }
        ]
      }
    }
  })

  await prisma.pointTransaction.create({
    data: { customerId: customer1.id, invoiceId: invoice2.id, delta: -50, reason: 'Tiêu điểm cho đơn hàng INV-002' }
  })

  // 🌟 MỚI - Đơn hàng 3: Áp dụng chi tiết Khuyến mãi xả hàng Lô Cận Date (Xoài Cát - batches[2])
  const xoaiProduct = products[2]
  const xoaiBatch = batches[2] // Lô NEAR_EXPIRY
  const purchaseQty = 2
  const discPerUnit = xoaiProduct.currentPrice * 0.3 // Giảm 30% = 25,500đ/kg
  const promotionalPrice = xoaiProduct.currentPrice - discPerUnit // Giá sau giảm = 59,500đ
  const itemSubtotal = promotionalPrice * purchaseQty // 119,000đ
  const totalItemDiscount = discPerUnit * purchaseQty // 51,000đ

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceCode: 'INV-003', customerId: customer1.id, createdById: salesStaff.id, channel: 'POS', paymentMethod: 'CASH', status: 'PAID',
      totalAmount: xoaiProduct.currentPrice * purchaseQty, // 170000 (Gốc)
      discountPercent: 30, discount: totalItemDiscount, pointsUsed: 0, finalAmount: itemSubtotal,
      items: {
        create: [
          {
            productId: xoaiProduct.id,
            batchId: xoaiBatch.id,
            quantity: purchaseQty,
            unitPrice: promotionalPrice,
            subtotal: itemSubtotal,
            discountAmount: totalItemDiscount, // Lưu vết số tiền giảm của dòng này
            promotionId: promoNearExpiry.id     // Liên kết trực tiếp chương trình khuyến mãi
          }
        ]
      }
    }
  })

  await prisma.pointTransaction.create({
    data: { customerId: customer1.id, invoiceId: invoice3.id, delta: 11, reason: 'Tích điểm mua hàng INV-003' }
  })

  // ==========================================
  // 10. TẠO STOCK ADJUSTMENT
  // ==========================================
  await prisma.stockAdjustment.create({
    data: {
      batchId: batches[0].id,
      before: batches[0].remaining, 
      after: batches[0].remaining - 1, 
      delta: -1, 
      reason: 'Kiểm kê phát hiện hao hụt mất 1 ống Táo Rockit',
      createdById: warehouseStaff.id
    }
  })

  // ==========================================
  // 11. TẠO WASTE LOGS
  // ==========================================
  const expiredBatch = batches.find(b => b.status === 'EXPIRED') || batches[3] 
  await prisma.wasteLog.create({
    data: { batchId: expiredBatch.id, quantity: 3.5, reason: 'EXPIRED', note: 'Dâu mốc trắng, đem tiêu hủy khỏi kệ', createdById: warehouseStaff.id }
  })

  // ==========================================
  // 12. 🌟 MỚI: TẠO WORK SHIFTS (CA LÀM VIỆC)
  // ==========================================
  await prisma.workShift.createMany({
    data: [
      {
        userId: salesStaff.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        shiftType: 'MORNING',
        status: 'COMPLETED'
      },
      {
        userId: warehouseStaff.id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        shiftType: 'AFTERNOON',
        status: 'SCHEDULED'
      }
    ]
  })

  // ==========================================
  // 13. 🌟 MỚI: TẠO AUDIT LOGS (NHẬT KÝ HỆ THỐNG)
  // ==========================================
  await prisma.auditLog.createMany({
    data: [
      {
        userId: manager.id,
        action: 'UPDATE_PRODUCT_PRICE',
        target: 'Product',
        targetId: products[0].id,
        oldValue: JSON.stringify({ currentPrice: 130000 }),
        newValue: JSON.stringify({ currentPrice: 135000 })
      },
      {
        userId: warehouseStaff.id,
        action: 'ADJUST_STOCK_INVENTORY',
        target: 'Batch',
        targetId: batches[0].id,
        oldValue: JSON.stringify({ remaining: batches[0].remaining }),
        newValue: JSON.stringify({ remaining: batches[0].remaining - 1 })
      }
    ]
  })

  console.log('✅ Seed dữ liệu thành công hoàn toàn theo cấu trúc mới!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })