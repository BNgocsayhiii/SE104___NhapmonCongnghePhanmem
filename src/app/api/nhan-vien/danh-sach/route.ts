import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secret-key-change-in-production'
);

async function getAuthPayload(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// [GET] Lấy danh sách
export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });

    let users = [];
    if (payload.role === 'MANAGER') {
      users = await prisma.user.findMany({
        select: { id: true, username: true, fullName: true, phone: true, email: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      users = await prisma.user.findMany({
        where: { id: payload.id as string },
        select: { id: true, username: true, fullName: true, phone: true, email: true, role: true, status: true, createdAt: true },
      });
    }

    return NextResponse.json({ success: true, data: users, currentRole: payload.role, currentUserId: payload.id });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}

// [POST] Thêm nhân viên (MANAGER only)
export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    if (payload.role !== 'MANAGER') return NextResponse.json({ success: false, message: 'Không có quyền' }, { status: 403 });

    const { username, fullName, phone, email, role } = await req.json();
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return NextResponse.json({ success: false, message: 'Tên đăng nhập đã tồn tại!' }, { status: 400 });

    const hashedPassword = await bcrypt.hash('123456', 10);
    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword, fullName, phone, email, role: role || 'STAFF_SALES', status: 'ACTIVE' },
      select: { id: true, username: true, fullName: true, role: true, status: true },
    });

    return NextResponse.json({ success: true, data: newUser, message: 'Tạo tài khoản thành công! Mật khẩu mặc định: 123456' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}

// [PUT] Cập nhật thông tin
export async function PUT(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });

    const { id, fullName, phone, email, password, role } = await req.json();

    // Nhân viên chỉ được sửa chính mình
    if (payload.role !== 'MANAGER' && id !== payload.id) {
      return NextResponse.json({ success: false, message: 'Không có quyền chỉnh sửa' }, { status: 403 });
    }

    const updateData: any = { fullName, phone, email };
    // Chỉ cập nhật mật khẩu nếu người dùng đang tự sửa cho chính bản thân mình
    if (password) {
      if (id === payload.id) {
        updateData.password = await bcrypt.hash(password, 10);
      }
    }    // Chỉ MANAGER mới được đổi role
    if (payload.role === 'MANAGER' && role) updateData.role = role;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, fullName: true, phone: true, email: true, role: true, status: true },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Cập nhật thành công!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}

// [PATCH] Vô hiệu hóa / kích hoạt tài khoản (MANAGER only)
export async function PATCH(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    if (payload.role !== 'MANAGER') return NextResponse.json({ success: false, message: 'Không có quyền' }, { status: 403 });

    const { id, status } = await req.json();
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, fullName: true },
    });

    return NextResponse.json({ success: true, data: updated, message: `Đã ${status === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản` });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}