// backend/controllers/userController.js
import { sql } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

// Lấy tất cả người dùng
export const getAllUsers = async (req, res) => {
  try {
    const users = await sql`SELECT * FROM users`;
    res.status(200).json({ success: true, data: users });
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
      INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${hashedPassword})
      RETURNING id, name, email, created_at
    `;

    const token = jwt.sign({ id: user[0].id, email: user[0].email }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
    const user = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      return res.status(400).json({ success: false, error: 'Email không tồn tại' });
    }

    const match = await bcrypt.compare(password, user[0].password);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign({ id: user[0].id, email: user[0].email }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

    let user = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      const dummyPassword = await bcrypt.hash(googleId, 10);
      user = await sql`
        INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${dummyPassword})
        RETURNING id, name, email, created_at
      `;
    }

    const jwtToken = jwt.sign({ id: user[0].id, email: user[0].email }, process.env.JWT_SECRET, { expiresIn: '1h' });
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