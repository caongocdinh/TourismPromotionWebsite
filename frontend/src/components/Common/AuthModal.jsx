import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setShowAuth, setShowProfile } from '../../redux/slices/uiSlice';
import { setUser } from '../../redux/slices/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
function AuthModal() {
  const dispatch = useDispatch();
    const navigate = useNavigate(); 
  const { showAuth } = useSelector((state) => state.ui);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    dispatch(setShowAuth(false));
    setForgotPassword(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (forgotPassword) {
      try {
        const response = await fetch('http://localhost:5000/api/users/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Email khôi phục đã được gửi!', { position: 'top-right', autoClose: 3000 });
        } else {
          toast.error(data.error || 'Không thể gửi email khôi phục', { position: 'top-right', autoClose: 3000 });
        }
      } catch (error) {
        console.error('Lỗi khi gửi email khôi phục:', error);
        toast.error('Lỗi server', { position: 'top-right', autoClose: 3000 });
      }
      handleClose();
      return;
    }

    if (isLogin) {
      try {
        const response = await fetch('http://localhost:5000/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          dispatch(setUser({ user: data.data, token: data.token }));
          toast.success('Đăng nhập thành công!', { position: 'top-right', autoClose: 3000 });
          
          // Kiểm tra nếu user là admin thì chuyển hướng sang trang admin
          if (data.data.role === 'admin') {
            navigate('/admin'); // Chuyển hướng sang trang admin
          } else {
            dispatch(setShowProfile(true)); // Mở modal hồ sơ cho user thường
          }
        }
      } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        toast.error(error.message || 'Lỗi server', { position: 'top-right', autoClose: 3000 });
      }
    } else {
      if (password !== confirmPassword) {
        toast.error('Mật khẩu không khớp!', { position: 'top-right', autoClose: 3000 });
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          dispatch(setUser({ user: data.data, token: data.token }));
          toast.success('Đăng ký thành công!', { position: 'top-right', autoClose: 3000 });
          dispatch(setShowProfile(true));
        }
      } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        toast.error(error.message || 'Lỗi server', { position: 'top-right', autoClose: 3000 });
      }
    }
    handleClose();
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        dispatch(setUser({ user: data.data, token: data.token }));
        toast.success('Đăng nhập Google thành công!', { position: 'top-right', autoClose: 3000 });
        
        // Kiểm tra nếu user là admin thì chuyển hướng sang trang admin
        if (data.data.role === 'admin') {
          navigate('/admin'); // Chuyển hướng sang trang admin
        } else {
          dispatch(setShowProfile(true)); // Mở modal hồ sơ cho user thường
        }
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập Google:', error);
      toast.error(error.message || 'Lỗi server', { position: 'top-right', autoClose: 3000 });
    }
    handleClose();
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
    toast.error('Đăng nhập Google thất bại', { position: 'top-right', autoClose: 3000 });
    setIsLoading(false);
  };

  return (
    showAuth && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <button onClick={handleClose} className="float-right text-gray-500 hover:text-gray-700">
            ×
          </button>
          <h2 className="text-xl font-bold mb-4">
            {forgotPassword ? 'Quên Mật Khẩu' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <form onSubmit={handleSubmit}>
            {forgotPassword ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi Email Khôi Phục'}
                </button>
              </>
            ) : (
              <>
                {!isLogin && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Tên</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-9 text-gray-500"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {!isLogin && (
                  <div className="mb-4 relative">
                    <label className="block text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-9 text-gray-500"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                )}
                {isLogin && (
                  <div className="mb-4 text-right">
                    <button
                      type="button"
                      onClick={() => setForgotPassword(true)}
                      className="text-blue-600 text-sm hover:underline"
                      disabled={isLoading}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              </>
            )}
          </form>

          {!forgotPassword && (
            <>
              <div className="my-4 flex items-center">
                <hr className="flex-grow border-gray-300" />
                <span className="px-3 text-gray-500">Hoặc</span>
                <hr className="flex-grow border-gray-300" />
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  buttonText={isLogin ? 'Đăng nhập với Google' : 'Đăng ký với Google'}
                  disabled={isLoading}
                />
              </div>
              <p className="mt-4 text-center text-sm">
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  {isLogin ? 'Đăng ký' : 'Đăng nhập'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    )
  );
}

export default AuthModal;