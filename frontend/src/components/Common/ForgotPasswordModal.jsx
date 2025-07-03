import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPasswordModal = ({ show, onClose }) => {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập mã + mật khẩu mới
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/users/send-reset-code', { email });
      toast.success('Đã gửi mã xác nhận về email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gửi mã thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/users/reset-password', {
        email, code, newPassword, confirmPassword
      });
      toast.success('Đặt lại mật khẩu thành công!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-primary">Quên mật khẩu</h2>
        {step === 1 ? (
          <>
            <label className="block mb-2 text-sm font-medium">Nhập email đã đăng ký</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={loading}
              >
                Đóng
              </button>
              <button
                onClick={handleSendCode}
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="block mb-2 text-sm font-medium">Mã xác nhận đã gửi về email</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              disabled={loading}
            />
            <label className="block mb-2 text-sm font-medium">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              disabled={loading}
            />
            <label className="block mb-2 text-sm font-medium">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={loading}
              >
                Đóng
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal; 