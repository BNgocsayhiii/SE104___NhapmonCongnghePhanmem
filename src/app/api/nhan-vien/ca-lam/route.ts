import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secret-key-change-in-production'
);

// Hàm phụ trợ lấy thông tin user từ Token
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

// [GET] Lấy danh sách ca làm việc trong một khoảng thời gian (1 tuần)
export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });

    const url = new URL(req.url);
    const startStr = url.searchParams.get('start');
    const endStr = url.searchParams.get('end');

    if (!startStr || !endStr) {
      return NextResponse.json({ success: false, message: 'Thiếu ngày bắt đầu/kết thúc' }, { status: 400 });
    }

    const shifts = await prisma.workShift.findMany({
      where: {
        date: {
          gte: new Date(startStr),
          lte: new Date(endStr),
        },
      },
      include: {
        user: {
          select: { id: true, fullName: true, role: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Lỗi GET ca làm việc:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}

// [POST] Đăng ký hoặc Hủy đăng ký ca làm (Toggle)
export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    if (payload.role === 'MANAGER') {
        return NextResponse.json({ success: false, message: 'Quản lý là Full-time, không cần đăng ký ca!' }, { status: 403 });
        }
    const { date, shiftType } = await req.json(); // date định dạng 'YYYY-MM-DD'
    if (!date || !shiftType) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin ca làm' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Kiểm tra xem user đã đăng ký ca này chưa
    const existingShift = await prisma.workShift.findUnique({
      where: {
        userId_date_shiftType: {
          userId: payload.id as string,
          date: targetDate,
          shiftType: shiftType,
        }
      }
    });

    if (existingShift) {
      // Đã đăng ký -> Thực hiện Hủy (Delete)
      await prisma.workShift.delete({
        where: { id: existingShift.id }
      });
      return NextResponse.json({ success: true, message: 'Đã hủy ca làm việc', action: 'REMOVED' });
    } else {
      // Chưa đăng ký -> Thực hiện Đăng ký (Create)
      const newShift = await prisma.workShift.create({
        data: {
          userId: payload.id as string,
          date: targetDate,
          shiftType: shiftType,
          status: 'SCHEDULED'
        }
      });
      return NextResponse.json({ success: true, data: newShift, message: 'Đăng ký ca thành công', action: 'ADDED' });
    }
  } catch (error) {
    console.error('Lỗi POST ca làm việc:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}