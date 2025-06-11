// backend/routes/userRoutes.js
import express from 'express';
import { getAllUsers, register, login, googleLogin, forgotPassword } from '../controllers/userController.js';
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

export default router;