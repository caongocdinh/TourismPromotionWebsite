import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('🔍 Stored token:', storedToken);
      if (storedToken && !user) {
        try {
          const response = await fetch('http://localhost:5000/api/users/profile', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          console.log('🔍 API response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 API response data:', data);
            if (data.success) {
              dispatch(setUser({ user: data.data, token: storedToken }));
            } else {
              throw new Error(data.message || 'Không thể lấy thông tin người dùng');
            }
          } else {
            const errorText = await response.text();
            throw new Error(`Lỗi API: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          console.error('Lỗi khi khởi tạo auth:', error.message);
          dispatch(logout());
          toast.error(`Phiên đăng nhập đã hết hạn hoặc không hợp lệ: ${error.message}`, {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    };

    initializeAuth();
  }, [dispatch, user]);

  return { user, token };
};

export default useAuth;