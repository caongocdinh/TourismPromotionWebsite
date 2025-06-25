import jwt from 'jsonwebtoken';
  import { sql } from '../config/db.js';

  export const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    // console.log('🔍 Received token:', token);
    // console.log('🔍 Request headers:', req.headers);

    if (!token || token.trim() === "" || token === "undefined" || token === "null") {
      console.log('🔍 No usable token provided');
      req.user = null;
      return next(); // Cho phép guest truy cập
    }
    

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log('🔍 Decoded JWT:', decoded);

      if (!decoded.id || isNaN(Number(decoded.id))) {
        return res.status(400).json({ message: 'ID token không hợp lệ' });
      }

      const result = await sql`
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = ${decoded.id}
        LIMIT 1
      `;
      const user = result[0];
      // console.log('🔍 User from database:', user);

      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('❌ JWT verification error:', error.message, error.stack);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token đã hết hạn' });
      }
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  };

  export const authorize = (...roles) => {
    return (req, res, next) => {
      // console.log('🔍 Authorize - req.user:', req.user);
      if (!req.user && !roles.includes('guest')) {
        return res.status(401).json({ message: 'Yêu cầu đăng nhập để truy cập' });
      }
      if (req.user && !roles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ message: `Bạn không có quyền truy cập (Vai trò: ${req.user.role}, Yêu cầu: ${roles.join(', ')})` });
      }
      next();
    };
  };