import { useState, useEffect } from 'react';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/nhan-vien/danh-sach');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi server: ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setRole(json.currentRole);
        setCurrentUserId(json.currentUserId);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, role, currentUserId, isLoading, error, refetch: fetchUsers };
}