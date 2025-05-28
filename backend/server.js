// backend/server.js

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { sql } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import Image from './models/image.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Kiểm tra middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Kiểm tra routes
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);

// Kiểm tra middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Lỗi:', err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// Kiểm tra kết nối và tạo bảng users
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) DEFAULT 'user',
        password VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        avt VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Tạo bảng users thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo bảng users:', error.stack);
  }
}

// Khởi động server sau khi kiểm tra DB
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server đã khởi động trên port ${PORT}`);
  });
});
