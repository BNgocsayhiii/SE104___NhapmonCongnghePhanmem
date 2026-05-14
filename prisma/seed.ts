import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('Admin@123', 10)
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashed,
      fullName: 'Quản lý',
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  })

  const nvbh = await prisma.user.upsert({
    where: { username: 'banhang01' },
    update: {},
    create: {
      username: 'banhang01',
      password: await bcrypt.hash('Banhang@123', 10),
      fullName: 'Trần Thị Bán Hàng',
      phone: '0912345678',
      role: 'STAFF_SALES',
      status: 'ACTIVE',
    },
  })

    const thukho = await prisma.user.upsert({
    where: { username: 'thukho01' },
    update: {},
    create: {
      username: 'thukho01',
      password: await bcrypt.hash('Thukho@123', 10),
      fullName: 'Lê Văn Thủ Kho',
      phone: '0923456789',
      role: 'STAFF_WAREHOUSE',
      status: 'ACTIVE',
    },
  })

  const supplier = await prisma.supplier.upsert({
    where: { phone: '0831234567' },
    update: {},
    create: {
      name: 'Công ty TNHH Trái Cây Tươi Việt',
      contactName: 'Nguyễn Văn Tươi',
      email: 'traicayviet@gmail.com',
      phone: '0831234567',
      address: '123 Nguyễn Trãi, Q.1, TP.HCM',
    },
  })

  const products = await Promise.all([
    prisma.product.upsert({
      where: { name: 'Táo Rockit New Zealand' },
      update: {},
      create: {
        name: 'Táo Rockit New Zealand',
        unit: 'kg',
        evaporationRate: 0.02,
        shelfLifeDays: 30,
        category: 'Nhập khẩu',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Nho xanh Mỹ không hạt' },
      update: {},
      create: {
        name: 'Nho xanh Mỹ không hạt',
        unit: 'kg',
        evaporationRate: 0.03,
        shelfLifeDays: 14,
        category: 'Nhập khẩu',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Xoài cát Hòa Lộc' },
      update: {},
      create: {
        name: 'Xoài cát Hòa Lộc',
        unit: 'kg',
        evaporationRate: 0.025,
        shelfLifeDays: 7,
        category: 'Nội địa',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Sầu riêng Monthong Thái' },
      update: {},
      create: {
        name: 'Sầu riêng Monthong Thái',
        unit: 'kg',
        evaporationRate: 0.015,
        shelfLifeDays: 5,
        category: 'Nhập khẩu',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Dưa hấu không hạt' },
      update: {},
      create: {
        name: 'Dưa hấu không hạt',
        unit: 'kg',
        evaporationRate: 0.02,
        shelfLifeDays: 10,
        category: 'Nội địa',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Cam Sành Vĩnh Long' },
      update: {},
      create: {
        name: 'Cam Sành Vĩnh Long',
        unit: 'kg',
        evaporationRate: 0.018,
        shelfLifeDays: 14,
        category: 'Nội địa',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Thanh long ruột đỏ' },
      update: {},
      create: {
        name: 'Thanh long ruột đỏ',
        unit: 'kg',
        evaporationRate: 0.022,
        shelfLifeDays: 7,
        category: 'Nội địa',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Bơ 034 Đắk Lắk' },
      update: {},
      create: {
        name: 'Bơ 034 Đắk Lắk',
        unit: 'kg',
        evaporationRate: 0.03,
        shelfLifeDays: 5,
        category: 'Nội địa',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Cherry Mỹ đỏ' },
      update: {},
      create: {
        name: 'Cherry Mỹ đỏ',
        unit: 'kg',
        evaporationRate: 0.035,
        shelfLifeDays: 10,
        category: 'Nhập khẩu',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Chuối già hương Fohla' },
      update: {},
      create: {
        name: 'Chuối già hương Fohla',
        unit: 'kg',
        evaporationRate: 0.028,
        shelfLifeDays: 6,
        category: 'Nội địa',
      },
    }),
  ])

  const admin = await prisma.user.findUnique({ where: { username: 'admin' } })

  const today = new Date()

  await prisma.batch.upsert({
    where: { batchCode: 'L-20260514-001' },
    update: {},
    create: {
      batchCode: 'L-20260514-001',
      productId: products[0].id,   // Táo Rockit
      supplierId: supplier.id,
      quantity: 50,
      remaining: 50,
      importPrice: 85000,
      packagedAt: new Date('2026-05-10'),
      expiredAt: new Date('2026-06-09'),
      status: 'FRESH',
      createdById: admin!.id,
    },
  })

  await prisma.batch.upsert({
    where: { batchCode: 'L-20260514-002' },
    update: {},
    create: {
      batchCode: 'L-20260514-002',
      productId: products[1].id,   // Nho xanh Mỹ
      supplierId: supplier.id,
      quantity: 30,
      remaining: 30,
      importPrice: 120000,
      packagedAt: new Date('2026-05-12'),
      expiredAt: new Date('2026-05-26'),
      status: 'FRESH',
      createdById: admin!.id,
    },
  })

}

main().catch(console.error).finally(() => prisma.$disconnect())