import express from 'express';
import multer from 'multer';
import ImageController from '../controllers/imageController.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';
import axios from 'axios';
import FormData from 'form-data';

const router = express.Router();

// Thiết lập storage cho Cloudinary
const tourismStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'tourism',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const uploadTourism = multer({ storage: tourismStorage });

// Route upload ảnh
router.post(
    '/upload',
    protect,
    uploadTourism.array('images', 5),
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'Không có file nào được gửi lên' });
            }
            const imageURLs = req.files.map(file => file.path);

            // Lưu vào cơ sở dữ liệu và trích xuất vector
            const pool = require('../config/db.js').pool;
            for (const imageUrl of imageURLs) {
                const imageRes = await pool.query(
                    'INSERT INTO images (imageUrl) VALUES ($1) RETURNING image_id',
                    [imageUrl]
                );
                const imageId = imageRes.rows[0].image_id;

                // Tải hình ảnh từ URL để trích xuất đặc trưng
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const formData = new FormData();
                formData.append('file', Buffer.from(response.data), 'image.jpg');
                const featuresRes = await axios.post('https://6fff-35-240-227-116.ngrok-free.app/extract-features', formData, {
                    headers: formData.getHeaders()
                });

                // Lưu vector vào image_vectors
                await pool.query(
                    'INSERT INTO image_vectors (vector_image, image_id) VALUES ($1, $2)',
                    [featuresRes.data.features, imageId]
                );
            }

            res.json({ imageURLs });
        } catch (error) {
            console.error('Lỗi upload ảnh:', error.message);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
);

// Thiết lập upload local cho tìm kiếm ảnh
const upload = multer({ dest: 'uploads/' });

// Route tìm kiếm ảnh tương tự
router.post('/search', upload.single('image'), ImageController.search);

export default router;