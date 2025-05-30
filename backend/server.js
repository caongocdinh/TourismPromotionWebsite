import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);

app.use((err, req, res, next) => {
    console.error('Lỗi:', err.stack);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
    console.log(`Server đã khởi động trên port ${PORT} vào lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
});