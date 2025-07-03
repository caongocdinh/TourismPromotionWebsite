import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setShowProfile } from '../../redux/slices/uiSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setUser } from '../../redux/slices/authSlice';
import ForgotPasswordModal from '../Common/ForgotPasswordModal';

const ProfileModal = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { showProfile } = useSelector((state) => state.ui);

  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);

  // State cho đổi mật khẩu
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);

  if (!showProfile || !user) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowChangePassword(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({ name: user.name, email: user.email });
  };

  const validate = () => {
    if (!form.name.trim()) return 'Tên không được để trống';
    if (!form.email.trim()) return 'Email không được để trống';
    // Đơn giản, có thể dùng regex kiểm tra email hợp lệ
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Email không hợp lệ';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        { name: form.name, email: form.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật thành công!');
      dispatch(setUser(res.data.data));
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };
  const validatePw = () => {
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) return 'Vui lòng nhập đầy đủ thông tin';
    if (pwForm.newPassword.length < 6) return 'Mật khẩu mới phải có ít nhất 6 ký tự';
    if (pwForm.newPassword !== pwForm.confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (pwForm.oldPassword === pwForm.newPassword) return 'Mật khẩu mới phải khác mật khẩu cũ';
    return null;
  };
  const handleChangePassword = async () => {
    const err = validatePw();
    if (err) {
      toast.error(err);
      return;
    }
    setPwLoading(true);
    try {
      await axios.put(
        `http://localhost:5000/api/users/${user.id}/password`,
        pwForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đổi mật khẩu thành công!');
      setShowChangePassword(false);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-primary">Hồ sơ người dùng</h2>
        {showChangePassword ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu cũ</label>
              <input
                type="password"
                name="oldPassword"
                value={pwForm.oldPassword}
                onChange={handlePwChange}
                className="w-full border rounded px-3 py-2 focus:outline-primary"
                disabled={pwLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
              <input
                type="password"
                name="newPassword"
                value={pwForm.newPassword}
                onChange={handlePwChange}
                className="w-full border rounded px-3 py-2 focus:outline-primary"
                disabled={pwLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="confirmPassword"
                value={pwForm.confirmPassword}
                onChange={handlePwChange}
                className="w-full border rounded px-3 py-2 focus:outline-primary"
                disabled={pwLoading}
              />
            </div>
            <div className="text-right mb-2">
              <button
                type="button"
                className="text-blue-500 hover:underline text-sm"
                onClick={() => setShowForgotModal(true)}
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={pwLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark"
                disabled={pwLoading}
              >
                {pwLoading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-primary"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-primary"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p><strong>Tên:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Vai trò:</strong> {user.role === 'admin' ? 'Admin' : 'User'}</p>
            <p><strong>Ngày tạo:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          {!isEditing && !showChangePassword && (
            <>
              <button
                onClick={handleEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => { setShowChangePassword(true); setIsEditing(false); }}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Đổi mật khẩu
              </button>
            </>
          )}
          <button
            onClick={() => dispatch(setShowProfile(false))}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Đóng
          </button>
        </div>
        <ForgotPasswordModal 
          show={showForgotModal} 
          onClose={() => {
            setShowForgotModal(false);
            setShowChangePassword(false);
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            toast.success('Bạn đã đặt lại mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.');
            dispatch(setShowProfile(false));
          }} 
        />
      </div>
    </div>
  );
};

export default ProfileModal;