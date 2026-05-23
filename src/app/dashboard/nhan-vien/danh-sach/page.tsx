'use client';

import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';

// ---- Kiểu dữ liệu ----
type User = {
  id: string; username: string; fullName: string;
  phone?: string; email?: string; role: string;
  status: string; createdAt?: string;
};

// ---- Ánh xạ hiển thị ----
const ROLE_LABEL: Record<string, string> = {
  MANAGER: 'Quản lý', STAFF_SALES: 'Thu ngân', STAFF_WAREHOUSE: 'Thủ kho',
};

const ROLE_COLOR: Record<string, string> = {
  MANAGER: 'bg-orange-50 text-orange-600 border border-orange-100',
  STAFF_SALES: 'bg-blue-50 text-blue-600 border border-blue-100',
  STAFF_WAREHOUSE: 'bg-purple-50 text-purple-600 border border-purple-100',
};

// ---- Data Trái Cây Nền ----
const floatingFruits = [
  { icon: '🍎', pos: 'top-[8%] left-[5%]', delay: '0s' },
  { icon: '🍐', pos: 'top-[15%] right-[12%]', delay: '1s' },
  { icon: '🍒', pos: 'top-[28%] left-[40%]', delay: '1.9s' },
  { icon: '🍇', pos: 'top-[40%] right-[10%]', delay: '0.5s' },
  { icon: '🥭', pos: 'top-[50%] left-[8%]', delay: '2s' },
  { icon: '🍊', pos: 'top-[62%] left-[62%]', delay: '3.5s' },
  { icon: '🍌', pos: 'top-[70%] left-[30%]', delay: '2.7s' },
  { icon: '🍓', pos: 'top-[82%] right-[8%]', delay: '2.5s' },
  { icon: '🍈', pos: 'top-[88%] left-[15%]', delay: '1.5s' },
  { icon: '🥥', pos: 'top-[92%] right-[45%]', delay: '1.2s' },
  { icon: '🥝', pos: 'top-[96%] left-[55%]', delay: '3s' },
  { icon: '🍑', pos: 'top-[20%] left-[25%]', delay: '0.8s' },
];

// ---- Component Modal Thêm/Sửa ----
// ĐÃ SỬA: Bổ sung currentUserId vào Props để check quyền
function UserModal({
  user, currentRole, currentUserId, onClose, onSaved,
}: {
  user: Partial<User> | null; currentRole: string; currentUserId: string;
  onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    role: user?.role || 'STAFF_SALES',
    username: user?.username || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/nhan-vien/danh-sach', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: user!.id, ...form } : form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1a4d2e] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg tracking-wide">
            {isEdit ? '✏️ Chỉnh sửa nhân viên' : '➕ Thêm nhân viên mới'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#60A61F] transition-all"
                placeholder="Nguyễn Văn A" />
            </div>

            {!isEdit && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập *</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#60A61F] transition-all"
                  placeholder="nguyen.van.a" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#60A61F] transition-all"
                placeholder="0909..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#60A61F] transition-all"
                placeholder="a@email.com" />
            </div>

            {/* ĐÃ SỬA LỖI TẠI ĐÂY: Chỉ hiện đổi mật khẩu nếu (isEdit VÀ Đang tự sửa Profile của mình) */}
            {isEdit && user?.id === currentUserId && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-gray-400 font-normal"></span>
                </label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#60A61F] transition-all"
                  placeholder="••••••" />
              </div>
            )}

            {/* Chỉ Quản lý và đang sửa người KHÁC mới được đổi chức vụ, không ai được tự đổi chức vụ của chính mình */}
            {currentRole === 'MANAGER' && user?.id !== currentUserId && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#60A61F] transition-all">
                  <option value="STAFF_SALES">Thu ngân</option>
                  <option value="STAFF_WAREHOUSE">Thủ kho</option>
                  <option value="MANAGER">Quản lý</option>
                </select>
              </div>
            )}
          </div>

          {!isEdit && (
            <p className="text-xs text-[#1a4d2e] bg-[#CBEFAA]/30 border border-[#CBEFAA] rounded-lg px-3 py-2">
              🔑 Mật khẩu mặc định: <strong className="text-[#60A61F]">123456</strong> — nhân viên tự đổi sau khi đăng nhập.
            </p>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end bg-gray-50/50 pt-4">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 rounded-lg bg-[#60A61F] hover:bg-[#4d8518] text-white text-sm font-bold transition-colors disabled:opacity-60 shadow-md shadow-[#60A61F]/20">
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Trang chính ----
export default function DanhSachNhanVienPage() {
  const { users, role, currentUserId, isLoading, error, refetch } = useUsers();
  const [search, setSearch] = useState('');
  
  const [modalUser, setModalUser] = useState<Partial<User> | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = async (u: User) => {
    if (!confirm(`Bạn chắc muốn ${u.status === 'ACTIVE' ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản "${u.fullName}"?`)) return;
    setTogglingId(u.id);
    try {
      const res = await fetch('/api/nhan-vien/danh-sach', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      });
      const json = await res.json();
      if (json.success) refetch();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 relative min-h-full z-0 bg-transparent space-y-5">
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

      <div className="relative z-10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a4d2e]">
              {role === 'MANAGER' ? 'Quản lý nhân sự' : 'Thông tin cá nhân'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {role === 'MANAGER' ? 'Quản lý toàn bộ tài khoản nhân viên' : 'Xem và cập nhật thông tin của bạn'}
            </p>
          </div>
          {role === 'MANAGER' && (
            <button onClick={() => setModalUser({})}
              className="flex items-center gap-2 bg-[#60A61F] hover:bg-[#4d8518] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-[#60A61F]/30 transition-all hover:shadow-lg hover:-translate-y-0.5">
              <span className="text-lg leading-none font-bold">+</span> Thêm nhân viên
            </button>
          )}
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {role === 'MANAGER' && (
            <div className="p-4 border-b border-gray-100 bg-gray-50/30">
              <div className="relative max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60A61F] transition-all bg-white text-gray-900 font-medium placeholder-gray-400"                  placeholder="Tìm kiếm nhân viên..." />
              </div>
            </div>
          )}

          {error && <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-8 h-8 border-4 border-[#CBEFAA] border-t-[#60A61F] rounded-full animate-spin mb-3" />
              <span className="text-sm font-medium">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/50 text-[#1a4d2e] border-b border-gray-100 text-xs uppercase tracking-wide">
                    <th className="px-5 py-4 font-bold">Nhân viên</th>
                    <th className="px-5 py-4 font-bold">Liên hệ</th>
                    <th className="px-5 py-4 font-bold">Vai trò</th>
                    <th className="px-5 py-4 font-bold">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((u) => (
                    <tr key={u.id} className={`hover:bg-[#f8faf7] transition-colors ${u.status === 'INACTIVE' ? 'opacity-60 bg-gray-50/50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1a4d2e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                            {u.fullName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-[#1a4d2e]">{u.fullName}</p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700 font-medium">{u.phone || '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{u.email || ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-[#eef8e5] text-[#4d8518] border border-[#d5edd2]'
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-[#60A61F]' : 'bg-red-500'}`}></span>
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {(role === 'MANAGER' || u.id === currentUserId) && (
                            <button onClick={() => setModalUser(u)}
                              className="px-3 py-1.5 rounded-md text-xs font-bold bg-white text-blue-500 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
                              ✏️ Sửa
                            </button>
                          )}
                          {role === 'MANAGER' && u.id !== currentUserId && (
                            <button onClick={() => handleToggleStatus(u)} disabled={togglingId === u.id}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold bg-white border border-gray-200 transition-all shadow-sm disabled:opacity-50 ${
                                u.status === 'ACTIVE'
                                  ? 'text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                                  : 'text-[#60A61F] hover:bg-[#eef8e5] hover:border-[#d5edd2] hover:text-[#4d8518]'
                              }`}>
                              {u.status === 'ACTIVE' ? '🔒 Khóa' : '🔓 Mở'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 font-medium">Không tìm thấy nhân viên nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalUser !== null && (
        <UserModal
          user={modalUser}
          currentRole={role}
          // ĐÃ THÊM DÒNG NÀY ĐỂ TRUYỀN ID VÀO MODAL
          currentUserId={currentUserId}
          onClose={() => setModalUser(null)}
          onSaved={() => { setModalUser(null); refetch(); }}
        />
      )}
    </div>
  );
}