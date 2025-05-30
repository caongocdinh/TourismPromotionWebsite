// import Image from '../models/image.js';
// import fs from 'fs';

// class ImageController {
//     static async search(req, res) {
//         try {
//             const imagePath = req.file.path;
//             const queryFeatures = await Image.extractFeatures(imagePath);
//             const similarImages = await Image.searchSimilarImages(queryFeatures);
//             fs.unlinkSync(imagePath);
//             res.json(similarImages);
//         } catch (error) {
//             res.status(500).json({ error: 'Error processing image' });
//         }
//     }
// }


// export default ImageController;


// src/controllers/uploadImageController.js
import { sql } from '../config/db.js';
import uploadImageCloudinary from '../utils/cloundinary.js';

import logger from '../utils/logger.js';

export const uploadImageController = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: 'No image provided',
        error: true,
        success: false,
      });
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({
        message: 'Image size exceeds 5MB',
        error: true,
        success: false,
      });
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
      return res.status(400).json({
        message: 'Invalid image format (only JPEG, PNG, GIF allowed)',
        error: true,
        success: false,
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImageCloudinary(file, 'tourism_posts');
    logger.info(`Image uploaded: ${uploadResult.secure_url}`);

    // Store in images table
    const image = await sql`
      INSERT INTO images (url, public_id, entity_type, entity_id)
      VALUES (${uploadResult.secure_url}, ${uploadResult.public_id}, 'temp', 0)
      RETURNING id, url, public_id
    `;

    return res.status(200).json({
      message: 'Image uploaded successfully',
      data: {
        id: image[0].id,
        url: `${uploadResult.secure_url}?w=800&q=80`,
        public_id: image[0].public_id,
      },
      error: false,
      success: true,
    });
  } catch (error) {
    logger.error(`Upload error: ${error.message}`);
    return res.status(500).json({
      message: error.message || 'Server error',
      error: true,
      success: false,
    });
  }
};
