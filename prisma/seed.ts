import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('⏳ Đang xóa dữ liệu cũ...')
  // Xóa theo thứ tự từ bảng con đến bảng cha để tránh lỗi Khóa ngoại (Foreign Key)
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.wasteLog.deleteMany()
  await prisma.batch.deleteMany()
  await prisma.importReceipt.deleteMany() // <-- Bảng mới
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()      // <-- Bảng mới
  await prisma.supplier.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  console.log('🌱 Đang tạo dữ liệu mới...')

  // ==========================================
  // 1. TẠO USERS (3 Vai trò)
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
  // 2. TẠO CATEGORIES (Bảng mới: Danh mục)
  // ==========================================
  const catNoiDia = await prisma.category.create({
    data: { name: 'Nội địa', description: 'Trái cây đặc sản các vùng miền Việt Nam' }
  })
  const catNhapKhau = await prisma.category.create({
    data: { name: 'Nhập khẩu', description: 'Trái cây nhập khẩu trực tiếp bằng đường hàng không/biển' }
  })

  // ==========================================
  // 3. TẠO SUPPLIERS (2 nhà cung cấp)
  // ==========================================
  const suppliers = await Promise.all([
    prisma.supplier.create({ // Chuyên hàng nội địa [0]
      data: { name: 'CTY Nông Sản Việt', contactName: 'Anh Bình', phone: '0811111111', address: 'Tiền Giang' },
    }),
    prisma.supplier.create({ // Chuyên hàng nhập khẩu [1]
      data: { name: 'K-Fruit Import', contactName: 'Mr. Lee', phone: '0822222222', address: 'Quận 7, TP.HCM' },
    }),
  ])

  // ==========================================
  // 4. TẠO PRODUCTS (Thay String category thành categoryId)
  // ==========================================
  const productsData = [
    // --- Hàng Nhập Khẩu ---
    { sku: '89300001', name: 'Táo Rockit New Zealand', unit: 'Ống', currentPrice: 135000, evaporationRate: 0.01, shelfLifeDays: 30, categoryId: catNhapKhau.id },
    { sku: '89300002', name: 'Nho xanh Autumn Crisp Mỹ', unit: 'kg', currentPrice: 280000, evaporationRate: 0.03, shelfLifeDays: 14, categoryId: catNhapKhau.id },
    { sku: '89300004', name: 'Cherry Đỏ Mỹ Size 9', unit: 'kg', currentPrice: 450000, evaporationRate: 0.02, shelfLifeDays: 10, categoryId: catNhapKhau.id },
    { sku: '89300006', name: 'Cam Vàng Navel Úc', unit: 'kg', currentPrice: 95000, evaporationRate: 0.015, shelfLifeDays: 20, categoryId: catNhapKhau.id },
    { sku: '89300007', name: 'Kiwi Vàng Zespri', unit: 'kg', currentPrice: 185000, evaporationRate: 0.02, shelfLifeDays: 15, categoryId: catNhapKhau.id },
    { sku: '89300008', name: 'Lê Hàn Quốc', unit: 'kg', currentPrice: 120000, evaporationRate: 0.01, shelfLifeDays: 25, categoryId: catNhapKhau.id },
    // --- Hàng Nội Địa ---
    { sku: '89300003', name: 'Xoài Cát Hòa Lộc', unit: 'kg', currentPrice: 85000, evaporationRate: 0.025, shelfLifeDays: 7, categoryId: catNoiDia.id },
    { sku: '89300005', name: 'Dưa Lưới Taki', unit: 'kg', currentPrice: 65000, evaporationRate: 0.015, shelfLifeDays: 10, categoryId: catNoiDia.id },
    { sku: '89300009', name: 'Sầu Riêng Ri6 Hạt Lép', unit: 'kg', currentPrice: 150000, evaporationRate: 0.03, shelfLifeDays: 5, categoryId: catNoiDia.id },
    { sku: '89300010', name: 'Dâu Tây Mộc Châu', unit: 'Hộp', currentPrice: 220000, evaporationRate: 0.04, shelfLifeDays: 4, categoryId: catNoiDia.id },
    { sku: '89300011', name: 'Bơ 034 Đắk Lắk', unit: 'kg', currentPrice: 55000, evaporationRate: 0.035, shelfLifeDays: 6, categoryId: catNoiDia.id },
    { sku: '89300012', name: 'Măng Cụt Cái Mơn', unit: 'kg', currentPrice: 75000, evaporationRate: 0.02, shelfLifeDays: 8, categoryId: catNoiDia.id },
  ]

  const products = []
  for (const p of productsData) {
    products.push(await prisma.product.create({ data: p }))
  }

  // ==========================================
  // 5. TẠO IMPORT RECEIPTS (Bảng mới: Phiếu nhập kho)
  // ==========================================
  const receiptNoiDia = await prisma.importReceipt.create({
    data: {
      receiptCode: 'PN-2605-001',
      supplierId: suppliers[0].id, // CTY Nông Sản Việt
      totalAmount: 25000000,       // Tổng tiền công nợ toa hàng này
      receivedById: warehouseStaff.id,
      note: 'Nhập chuyến xe tải nội địa định kỳ',
    }
  })

  const receiptNhapKhau = await prisma.importReceipt.create({
    data: {
      receiptCode: 'PN-2605-002',
      supplierId: suppliers[1].id, // K-Fruit Import
      totalAmount: 85000000,       // Tổng tiền công nợ toa hàng này
      receivedById: warehouseStaff.id,
      note: 'Nhập container lạnh từ cảng Cát Lái',
    }
  })

  // ==========================================
  // 6. TẠO BATCHES (Gắn vào Phiếu Nhập thay vì gắn thẳng vào Supplier)
  // ==========================================
  const today = new Date()
  const batches = []
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    
    // Gắn đúng phiếu nhập: Hàng nhập khẩu vào Phiếu 2, Hàng nội địa vào Phiếu 1
    const importReceiptId = product.categoryId === catNhapKhau.id ? receiptNhapKhau.id : receiptNoiDia.id
    
    let daysAgo = Math.floor(Math.random() * 5) + 1; 
    if (i === 6) daysAgo = 10; 
    if (i === 9) daysAgo = 3;  

    const packagedAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const expiredAt = new Date(packagedAt.getTime() + product.shelfLifeDays * 24 * 60 * 60 * 1000)
    
    let status = 'FRESH'
    const daysLeft = (expiredAt.getTime() - today.getTime()) / (1000 * 3600 * 24)
    if (daysLeft < 0) status = 'EXPIRED'
    else if (daysLeft <= 2) status = 'NEAR_EXPIRY'

    batches.push(
      await prisma.batch.create({
        data: {
          batchCode: `L-2605-${(i+1).toString().padStart(3, '0')}`,
          productId: product.id,
          importReceiptId: importReceiptId, // <-- Đổi dòng này (thay cho supplierId)
          quantity: 100,
          remaining: Math.floor(Math.random() * 80) + 10,
          importPrice: product.currentPrice * 0.6,
          packagedAt,
          expiredAt,
          status: status as any,
          createdById: warehouseStaff.id,
        }
      })
    )
  }

  // ==========================================
  // 7. TẠO CUSTOMERS (Khách hàng)
  // ==========================================
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Phạm Thị Lan', phone: '0987654321', points: 0, address: 'Q3, TP.HCM' } }),
    prisma.customer.create({ data: { name: 'Lý Hải', phone: '0912345678', points: 0, email: 'lyhai@gmail.com' } }),
    prisma.customer.create({ data: { name: 'Khách Vãng Lai', phone: '0000000000', points: 0 } }),
    prisma.customer.create({ data: { name: 'Chị Lan Anh', phone: '0911222333', email: 'lananh@email.com', address: 'Quận 1, TP.HCM', points: 0 } }),
    prisma.customer.create({ data: { name: 'Anh Minh Tuấn', phone: '0988777666', email: 'tuanminh@email.com', address: '123 Lê Lợi, Hà Nội', points: 0 } }),
    prisma.customer.create({ data: { name: 'Cô Hồng', phone: '0901112233', address: 'Quận Tân Bình, TP.HCM', points: 0 } }),
    prisma.customer.create({ data: { name: 'Anh Đức', phone: '0934567890', email: 'duc.nguyen@email.com', address: 'Hải Châu, Đà Nẵng', points: 0 } }),
    prisma.customer.create({ data: { name: 'Văn phòng ABC', phone: '02838123456', email: 'office@abc.vn', address: 'Tòa nhà Bitexco, Quận 1', points: 0 } }),
  ])

  // ==========================================
  // 8. TẠO INVOICES & INVOICE ITEMS (Hóa đơn)
  // ==========================================
  await prisma.invoice.create({
    data: {
      invoiceCode: 'INV-001', customerId: customers[1].id, createdById: salesStaff.id, channel: 'POS', paymentMethod: 'QR', status: 'PAID',
      totalAmount: 430000, discount: 0, finalAmount: 430000,
      items: {
        create: [
          { productId: products[0].id, batchId: batches[0].id, quantity: 2, unitPrice: products[0].currentPrice, subtotal: products[0].currentPrice * 2 },
          { productId: products[8].id, batchId: batches[8].id, quantity: 1.5, unitPrice: products[8].currentPrice, subtotal: products[8].currentPrice * 1.5 } 
        ]
      }
    }
  })

  await prisma.invoice.create({
    data: {
      invoiceCode: 'INV-002', customerId: customers[2].id, createdById: null, channel: 'ONLINE', paymentMethod: 'BANK_TRANSFER', status: 'DELIVERED',
      shippingAddress: 'Tòa nhà Bitexco, Q1, TP.HCM', shippingFee: 30000, trackingCode: 'GHTK-9999',
      totalAmount: 280000, discount: 0, finalAmount: 310000,
      items: {
        create: [
          { productId: products[1].id, batchId: batches[1].id, quantity: 1, unitPrice: products[1].currentPrice, subtotal: products[1].currentPrice * 1 }
        ]
      }
    }
  })

  // ==========================================
  // 9. TẠO WASTE LOGS (Hao hụt & Tiêu hủy)
  // ==========================================
  const expiredBatch = batches.find(b => b.status === 'EXPIRED') || batches[6] 
  
  await prisma.wasteLog.create({
    data: { batchId: expiredBatch.id, quantity: 3.5, reason: 'EXPIRED', note: 'Quả bị nẫu, không đạt chất lượng', createdById: warehouseStaff.id }
  })

  await prisma.wasteLog.create({
    data: { batchId: batches[9].id, quantity: 1, reason: 'DAMAGED', note: 'Hộp dâu bị dập nát trong quá trình vận chuyển', createdById: warehouseStaff.id }
  })

  console.log('✅ Seed dữ liệu (Hệ thống Ultimate) thành công!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })