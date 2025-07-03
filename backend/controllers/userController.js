import { sql } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

// Lấy tất cả người dùng
export const getAllUsers = async (req, res) => {
  try {
    const users = await sql`
      SELECT id, name, email, role, created_at FROM users
      ORDER BY created_at DESC
    `;
    console.log("Danh sách người dùng", users);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// Đăng ký
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin cần thiết' });
  }

  try {
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, error: 'Email đã tồn tại' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email}, ${hashedPassword}, 'user')
      RETURNING id, name, email, role, created_at
    `;

    const token = jwt.sign(
      { id: user[0].id, email: user[0].email, role: user[0].role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ success: true, data: user[0], token });
  } catch (error) {
    console.error('Lỗi khi thêm người dùng:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// Đăng nhập
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin cần thiết' });
  }

  try {
    const user = await sql`SELECT id, name, email, password, role, created_at FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      return res.status(400).json({ success: false, error: 'Email không tồn tại' });
    }

    const match = await bcrypt.compare(password, user[0].password);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user[0].id, email: user[0].email, role: user[0].role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({ success: true, data: user[0], token });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// Đăng nhập bằng Google
export const googleLogin = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Thiếu token Google' });
  }

  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.VITE_GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await sql`SELECT id, name, email, role, created_at FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      const dummyPassword = await bcrypt.hash(googleId, 10);
      user = await sql`
        INSERT INTO users (name, email, password, role)
        VALUES (${name}, ${email}, ${dummyPassword}, 'user')
        RETURNING id, name, email, role, created_at
      `;
    }

    const jwtToken = jwt.sign(
      { id: user[0].id, email: user[0].email, role: user[0].role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({ success: true, data: user[0], token: jwtToken });
  } catch (error) {
    console.error('Lỗi khi đăng nhập bằng Google:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// Quên mật khẩu
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Thiếu email' });
  }

  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      return res.status(400).json({ success: false, error: 'Email không tồn tại' });
    }

    console.log(`Gửi email khôi phục mật khẩu tới: ${email}`);
    res.status(200).json({ success: true, message: 'Email khôi phục đã được gửi (mô phỏng)' });
  } catch (error) {
    console.error('Lỗi khi gửi email khôi phục:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// Cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  // Chỉ cho phép user tự sửa hoặc admin
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Không có quyền cập nhật thông tin người dùng này' });
  }
  if (!name && !email) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin cập nhật' });
  }
  try {
    // Kiểm tra email trùng (nếu đổi email)
    if (email) {
      const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${id}`;
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: 'Email đã tồn tại' });
      }
    }
    const updated = await sql`
      UPDATE users SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email)
      WHERE id = ${id}
      RETURNING id, name, email, role, created_at
    `;
    if (!updated.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({ success: true, data: updated[0], message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// Đổi mật khẩu
export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Không có quyền đổi mật khẩu người dùng này' });
  }
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Mật khẩu xác nhận không khớp' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }
  try {
    const user = await sql`SELECT password FROM users WHERE id = ${id}`;
    if (!user.length) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    }
    // Nếu không phải admin thì phải kiểm tra mật khẩu cũ
    if (req.user.role !== 'admin') {
      const match = await bcrypt.compare(oldPassword, user[0].password);
      if (!match) {
        return res.status(400).json({ success: false, error: 'Mật khẩu cũ không đúng' });
      }
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${id}`;
    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// Hàm gửi email OTP
async function sendMail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}

// Gửi mã OTP về email khi quên mật khẩu
export const sendResetCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Thiếu email' });
  try {
    const user = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    if (!user.length) return res.status(404).json({ success: false, error: 'Email không tồn tại' });
    // Sinh mã OTP 6 số
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Lưu vào trường reset_code và reset_code_expiry (5 phút)
    await sql`UPDATE users SET reset_code = ${code}, reset_code_expiry = NOW() + INTERVAL '5 minutes' WHERE id = ${user[0].id}`;
    // Gửi email
    await sendMail(user[0].email, 'Mã xác nhận đặt lại mật khẩu', `Mã xác nhận của bạn là: ${code}`);
    res.status(200).json({ success: true, message: 'Đã gửi mã xác nhận về email' });
  } catch (error) {
    console.error('Lỗi gửi mã xác nhận:', error);
    if (error.response) {
      console.error('Error response:', error.response);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ success: false, error: error.message || 'Lỗi server' });
  }
};

// Đặt lại mật khẩu bằng mã OTP
export const resetPasswordWithCode = async (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;
  if (!email || !code || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Mật khẩu xác nhận không khớp' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }
  try {
    const user = await sql`SELECT id, reset_code, reset_code_expiry FROM users WHERE email = ${email}`;
    if (!user.length) return res.status(404).json({ success: false, error: 'Email không tồn tại' });
    if (!user[0].reset_code || !user[0].reset_code_expiry) {
      return res.status(400).json({ success: false, error: 'Bạn chưa yêu cầu mã xác nhận' });
    }
    if (user[0].reset_code !== code) {
      return res.status(400).json({ success: false, error: 'Mã xác nhận không đúng' });
    }
    if (new Date(user[0].reset_code_expiry) < new Date()) {
      return res.status(400).json({ success: false, error: 'Mã xác nhận đã hết hạn' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password = ${hashed}, reset_code = NULL, reset_code_expiry = NULL WHERE id = ${user[0].id}`;
    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    if (error.response) {
      console.error('Error response:', error.response);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ success: false, error: error.message || 'Lỗi server' });
  }
};