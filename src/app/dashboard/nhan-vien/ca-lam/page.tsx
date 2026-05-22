'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkShifts, ShiftType } from '@/hooks/useWorkShifts';

const floatingFruits = [
  { icon: '🍎', pos: 'top-[8%] left-[5%]', delay: '0s' },
  { icon: '🍐', pos: 'top-[15%] right-[12%]', delay: '1s' },
  { icon: '🍒', pos: 'top-[28%] left-[40%]', delay: '1.9s' },
  { icon: '🍇', pos: 'top-[40%] right-[10%]', delay: '0.5s' },
  { icon: '🥭', pos: 'top-[50%] left-[8%]', delay: '2s' },
  { icon: '🍊', pos: 'top-[62%] left-[62%]', delay: '3.5s' },
  { icon: '🍌', pos: 'top-[70%] left-[30%]', delay: '2.7s' },
  { icon: '🍓', pos: 'top-[82%] right-[8%]', delay: '2.5s' },
];

const SHIFT_HEADERS: { type: ShiftType; label: string; time: string }[] = [
  { type: 'MORNING', label: 'Ca Sáng', time: '06:00 - 12:00' },
  { type: 'AFTERNOON', label: 'Ca Chiều', time: '12:00 - 19:00' },
  { type: 'EVENING', label: 'Ca Tối', time: '19:00 - 23:00' },
];

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export default function WorkShiftPage() {
  // GỌI HOOK Ở ĐÂY (BÊN TRONG COMPONENT)
  const { user } = useAuth();
  const { shifts, isLoading, currentWeekStart, nextWeek, prevWeek, toggleShift, formatDateAPI } = useWorkShifts();

  const isManager = user?.role === 'MANAGER';

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="p-6 relative min-h-full z-0 bg-transparent">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        .floating-fruit {
          position: absolute;
          animation: float 6s ease-in-out infinite;
          opacity: 0.45;
          font-size: 1.7rem; 
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {floatingFruits.map((fruit, index) => (
          <span key={index} className={`floating-fruit ${fruit.pos}`} style={{ animationDelay: fruit.delay }}>
            {fruit.icon}
          </span>
        ))}
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-[#1a4d2e]">Lịch làm việc</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isManager ? "Bảng theo dõi lịch làm việc toàn bộ nhân viên" : "Nhấn vào các ô trống để đăng ký hoặc hủy ca làm của bạn"}
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-2 py-1.5 rounded-xl border border-gray-200 shadow-sm">
            <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">◀</button>
            <span className="text-sm font-bold text-[#1a4d2e] min-w-[150px] text-center">
              {weekDays[0].toLocaleDateString('vi-VN')} - {weekDays[6].toLocaleDateString('vi-VN')}
            </span>
            <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">▶</button>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
              <div className="w-10 h-10 border-4 border-[#CBEFAA] border-t-[#60A61F] rounded-full animate-spin mb-4" />
              <span className="text-sm font-medium">Đang tải lịch làm việc...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50/50">
                  <div className="p-4 text-center border-r border-gray-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ca / Ngày</span>
                  </div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="p-4 text-center border-r border-gray-100 last:border-r-0">
                      <p className="text-[13px] font-bold text-[#1a4d2e] mb-1">{DAY_NAMES[idx]}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {String(day.getDate()).padStart(2, '0')}/{String(day.getMonth() + 1).padStart(2, '0')}
                      </p>
                    </div>
                  ))}
                </div>

                {SHIFT_HEADERS.map((shiftHeader, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
                    <div className="p-4 border-r border-gray-100 flex flex-col justify-center items-center bg-gray-50/30">
                      <span className="font-bold text-[#1a4d2e] text-sm">{shiftHeader.label}</span>
                      <span className="text-[11px] text-gray-400 font-medium mt-1">{shiftHeader.time}</span>
                    </div>

                    {weekDays.map((day, colIdx) => {
                      const dateStr = formatDateAPI(day);
                      const cellShifts = shifts.filter(s => s.date.startsWith(dateStr) && s.shiftType === shiftHeader.type);
                      const isMeRegistered = cellShifts.some(s => s.userId === user?.id);

                      return (
                        <div 
                          key={colIdx} 
                          className={`p-3 border-r border-gray-100 min-h-[120px] transition-all relative group flex flex-col gap-2 ${
                            !isManager ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
                          } ${isMeRegistered ? 'bg-[#eef8e5]' : ''}`}
                          onClick={!isManager ? () => toggleShift(dateStr, shiftHeader.type) : undefined}
                        >
                           {/* Hint đăng ký */}
                          {!isManager && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]">
                              <span className={`bg-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg ${
                                  isMeRegistered ? 'text-red-600' : 'text-[#7048E8]'
                                }`}>
                                {isMeRegistered ? '❌ Hủy' : '➕ Đăng ký'}
                              </span>
                            </div>
                          )}

                          {cellShifts.map(s => (
                            <div key={s.id} className="flex items-center gap-2 bg-white/70 p-1.5 rounded-lg border border-gray-100/50 shadow-sm relative z-0">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${
                                  s.userId === user?.id ? 'bg-[#ff6f00]' : 'bg-[#1a4d2e]'
                                }`}>
                                  {s.user.fullName[0].toUpperCase()}
                                </div>
                                <span className={`text-[11px] font-bold truncate ${s.userId === user?.id ? 'text-[#ff6f00]' : 'text-[#1a4d2e]'}`}>
                                  {s.user.fullName}
                                </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}