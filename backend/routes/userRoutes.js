// backend/routes/userRoutes.js
import express from 'express';
import { getAllUsers, register, login, googleLogin, forgotPassword } from '../controllers/userController.js';
import {protect} from '../middleware/auth.js';

const router = express.Router();

// Route công khai (không cần xác thực)
router.get('/', getAllUsers); // Lấy tất cả người dùng (có thể bảo vệ sau nếu cần)
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);

// Route bảo vệ (cần xác thực token)
router.get('/profile', protect, (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;