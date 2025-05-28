import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setShowAuth } from '../../redux/slices/uiSlice';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';

function AuthModal() {
  const dispatch = useDispatch();
  const { showAuth } = useSelector((state) => state.ui);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For re-enter password
  const [name, setName] = useState(''); // For registration
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle confirm password visibility
  const [forgotPassword, setForgotPassword] = useState(false); // Toggle forgot password view

  const handleClose = () => {
    dispatch(setShowAuth(false));
    setForgotPassword(false); // Reset forgot password state on close
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (forgotPassword) {
      // Handle forgot password logic (e.g., send reset email)
      console.log('Forgot password email:', email);
      handleClose();
      return;
    }

    if (isLogin) {
      // Handle login logic here (e.g., API call)
      console.log('Login with:', { email, password });
    } else {
      // Validate passwords match for registration
      if (password !== confirmPassword) {
        alert('Mật khẩu không khớp!');
        return;
      }
      // Handle registration logic here (e.g., API call)
      console.log('Register with:', { name, email, password });
    }
    handleClose();
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google Login Success:', credentialResponse);
    // Handle Google login (e.g., send token to backend for verification)
    handleClose();
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
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
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
                >
                  Gửi Email Khôi Phục
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-9 text-gray-500"
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-9 text-gray-500"
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
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
                >
                  {isLogin ? 'Đăng nhập' : 'Đăng ký'}
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
                />
              </div>
              <p className="mt-4 text-center text-sm">
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:underline"
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