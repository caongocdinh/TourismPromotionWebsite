// Kiểm tra code imageRoutes.js

import express from 'express';
import multer from 'multer';
import ImageController from '../controllers/imageController.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Thiết lập storage cho Cloudinary
const tourismStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tourism', // Thư mục trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

// Khởi tạo middleware upload sử dụng Cloudinary
const uploadTourism = multer({ storage: tourismStorage });

// Route upload ảnh tourism
router.post(
  '/upload',
  protect, // Nếu muốn bảo vệ route, bỏ nếu không cần
  uploadTourism.array('images', 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Không có file nào được gửi lên' });
      }
      // Lấy đường dẫn ảnh đã upload lên Cloudinary
      const imageURLs = req.files.map(file => file.path);
      res.json({ imageURLs });
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
);

// Thiết lập upload local cho tìm kiếm ảnh
const upload = multer({ dest: 'uploads/' });

// Route tìm kiếm ảnh tương tự
router.post('/search', upload.single('image'), ImageController.search);

export default router;

// Nhận xét kiểm tra:
// - Đã import đúng các module cần thiết.
// - Sử dụng CloudinaryStorage để upload ảnh lên Cloudinary, đúng cấu hình.
// - Route /upload có bảo vệ bằng middleware protect (có thể bỏ nếu không cần).
// - Route /search sử dụng multer để upload file tạm vào thư mục uploads/.
// - Đã xử lý lỗi khi không có file upload.
// - Đã export router đúng chuẩn.
// => Code hợp lệ, có thể sử dụng cho upload và tìm kiếm ảnh.