import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setShowProfile } from '../../redux/slices/uiSlice';

const ProfileModal = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { showProfile } = useSelector((state) => state.ui);

  if (!showProfile || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Hồ sơ người dùng</h2>
        <div className="space-y-2">
          <p><strong>Tên:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Vai trò:</strong> {user.role === 'admin' ? 'Admin' : 'User'}</p>
          <p><strong>Ngày tạo</p>: {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => dispatch(setShowProfile(false))}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;