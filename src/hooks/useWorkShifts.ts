'use client';

import { useState, useEffect, useCallback } from 'react';

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface ShiftUser {
  id: string;
  fullName: string;
  role: string;
}

export interface WorkShift {
  id: string;
  userId: string;
  date: string; // ISO String từ API
  shiftType: ShiftType;
  status: string;
  user: ShiftUser;
}

// Hàm lấy ngày Thứ 2 của tuần chứa date truyền vào
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh nếu là Chủ Nhật (0)
  return new Date(d.setDate(diff));
};

// Format ngày thành YYYY-MM-DD để gửi lên API Prisma an toàn
const formatDateAPI = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useWorkShifts() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    // Reset giờ về 0h để tính toán chuẩn xác
    now.setHours(0, 0, 0, 0); 
    return getStartOfWeek(now);
  });
  
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tính ngày Chủ nhật của tuần hiện tại
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const startStr = formatDateAPI(currentWeekStart);
      const endStr = formatDateAPI(currentWeekEnd);
      
      const res = await fetch(`/api/nhan-vien/ca-lam?start=${startStr}&end=${endStr}`);
      const json = await res.json();
      if (json.success) {
        setShifts(json.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart, currentWeekEnd]);

    useEffect(() => {
        // Gọi thẳng fetchShifts bên trong mà không cần callback phức tạp
        // Đảm bảo chỉ chạy khi tuần thay đổi
        let isMounted = true;
        
        async function loadData() {
        setIsLoading(true);
        const startStr = formatDateAPI(currentWeekStart);
        const endStr = formatDateAPI(currentWeekEnd);
        
        try {
            const res = await fetch(`/api/nhan-vien/ca-lam?start=${startStr}&end=${endStr}`);
            const json = await res.json();
            if (isMounted && json.success) {
            setShifts(json.data);
            }
        } catch (err) {
            console.error("Lỗi fetch:", err);
        } finally {
            if (isMounted) setIsLoading(false);
        }
        }

        loadData();
        return () => { isMounted = false; }; // Cleanup để tránh cập nhật state khi component unmount
    }, [currentWeekStart]); // Chỉ phụ thuộc vào currentWeekStart

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const toggleShift = async (dateStr: string, shiftType: ShiftType) => {
    try {
      const res = await fetch('/api/nhan-vien/ca-lam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, shiftType }),
      });
      const json = await res.json();
      if (json.success) {
        // Gọi lại data để cập nhật giao diện sau khi đăng ký/hủy
        fetchShifts();
      } else {
        alert(json.message);
      }
    } catch (error) {
      alert('Lỗi kết nối khi thao tác ca làm');
    }
  };

  return {
    shifts,
    isLoading,
    currentWeekStart,
    currentWeekEnd,
    nextWeek,
    prevWeek,
    toggleShift,
    formatDateAPI
  };
}