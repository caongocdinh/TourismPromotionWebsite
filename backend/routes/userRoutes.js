// backend/routes/userRoutes.js
import express from 'express';
import { getAllUsers, register, login, googleLogin, forgotPassword, updateUser, changePassword, sendResetCode, resetPasswordWithCode, deleteUser, toggleUserStatus } from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Route công khai (không cần xác thực, dành cho guest)
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);

// Route bảo vệ
router.get('/', protect, authorize('admin'), getAllUsers); // Chỉ admin được lấy danh sách người dùng
router.get('/profile', protect, authorize('user', 'admin'), (req, res) => {
  res.json({ success: true, data: req.user });
});
router.put('/:id', protect, authorize('user', 'admin'), updateUser);
router.put('/:id/password', protect, authorize('user', 'admin'), changePassword);

// Quên mật khẩu: gửi mã xác nhận và đặt lại mật khẩu
router.post('/send-reset-code', sendResetCode);
router.post('/reset-password', resetPasswordWithCode);
router.delete('/:id', protect, authorize('admin'), deleteUser); // Xóa người dùng
router.patch('/:id/status', protect, authorize('admin'), toggleUserStatus); // Khóa / mở khóa



export default router;