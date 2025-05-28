import Image from '../models/image.js';
import fs from 'fs';

class ImageController {
    static async search(req, res) {
        try {
            const imagePath = req.file.path;
            if (!imagePath) {
                console.error('Không có file upload');
                return res.status(400).json({ error: 'Không có file upload' });
            }
            const queryFeatures = await Image.extractFeatures(imagePath);
            const similarImages = await Image.searchSimilarImages(queryFeatures);
            fs.unlinkSync(imagePath);
            res.json(similarImages);
        } catch (error) {
            console.error('Image search error:', error); 
            res.status(500).json({ error: 'Error processing image' });
        }
    }
}

export default ImageController;