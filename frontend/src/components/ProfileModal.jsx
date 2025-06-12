import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setShowProfile } from '../redux/slices/uiSlice';

const ProfileModal = () => {
  const dispatch = useDispatch();
  const { showProfile } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  if (!showProfile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-primary">Thông tin cá nhân</h3>
        <div className="space-y-4">
          <p><strong>Tên:</strong> {user?.name || 'Chưa cập nhật'}</p>
          <p><strong>Email:</strong> {user?.email || 'Chưa cập nhật'}</p>
          <p><strong>Vai trò:</strong> {user?.role || 'Khách hàng'}</p>
        </div>
        <button
          onClick={() => dispatch(setShowProfile(false))}
          className="mt-6 bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;