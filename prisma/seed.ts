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
  console.log('✅ Tạo tài khoản admin thành công!')
  console.log('   Username: admin')
  console.log('   Password: Admin@123')
}

main().catch(console.error).finally(() => prisma.$disconnect())