// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

// Middleware xác thực người dùng qua token (PostgreSQL)
export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    // Lưu ý: Không trả về lỗi ngay, mà gán req.user = null để xử lý guest
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Decoded JWT:', decoded);
    console.log('Thời gian server:', new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));

    // Kiểm tra ID hợp lệ
    if (!decoded.id || isNaN(Number(decoded.id))) {
      return res.status(400).json({ message: 'ID token không hợp lệ' });
    }

    // Lấy thông tin user từ PostgreSQL (bảng users)
    const result = await sql`
      SELECT id, name, email, role, status, avt, created_at
      FROM users
      WHERE id = ${decoded.id}
      LIMIT 1
    `;
    const user = result[0];

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ JWT verification error:', error);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Middleware phân quyền theo vai trò
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Nếu không có user (guest) và 'guest' không nằm trong roles, từ chối
    if (!req.user && !roles.includes('guest')) {
      return res.status(401).json({ message: 'Yêu cầu đăng nhập để truy cập' });
    }
    // Nếu có user nhưng role không phù hợp, từ chối
    if (req.user && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }
    next();
  };
};