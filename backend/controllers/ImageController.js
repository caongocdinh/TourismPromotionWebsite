import Image from '../models/image.js';
import fs from 'fs';

class ImageController {
    static async search(req, res) {
        try {
            const imagePath = req.file.path;
            if (!imagePath) {
                return res.status(400).json({ error: 'Không có file upload' });
            }
            const queryFeatures = await Image.extractFeatures(imagePath);
            const similarImages = await Image.searchSimilarImages(queryFeatures);
            fs.unlinkSync(imagePath); // Xóa file tạm
            res.json(similarImages);
        } catch (error) {
            console.error('Lỗi tìm kiếm hình ảnh:', error.message);
            res.status(500).json({ error: 'Lỗi xử lý hình ảnh' });
        }
    }
}

export default ImageController;