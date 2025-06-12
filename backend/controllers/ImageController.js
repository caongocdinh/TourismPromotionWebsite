import axios from 'axios';
import { sql } from "../config/db.js";
import uploadImageCloudinary from "../utils/cloundinary.js";
import logger from "../utils/logger.js";
import FormData from 'form-data';

export const uploadImageController = async (req, res) => {
  console.log("FILE RECEIVED:", req.file);
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "No image provided",
        error: true,
        success: false,
      });
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({
        message: "Image size exceeds 5MB",
        error: true,
        success: false,
      });
    }
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.mimetype)) {
      return res.status(400).json({
        message: "Invalid image format (only JPEG, PNG, GIF allowed)",
        error: true,
        success: false,
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImageCloudinary(file, "tourism_posts");
    logger.info(`Image uploaded: ${uploadResult.secure_url}`);

    // Store in images table
    const image = await sql`
      INSERT INTO images (url, public_id, entity_type, entity_id)
      VALUES (${uploadResult.secure_url}, ${uploadResult.public_id}, 'temp', 0)
      RETURNING id, url, public_id
    `;

    // Gửi file tới Flask API
    const formData = new FormData();
    formData.append('image', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const flaskResponse = await axios.post(
      "http://localhost:5001/extract", // Hoặc 5001 nếu Flask chạy trên 5001
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    const vector = flaskResponse.data.features;

    // Lưu vector vào DB
    await sql`
      INSERT INTO image_vectors (image_id, features)
      VALUES (${image[0].id}, ${JSON.stringify(vector)})
    `;

    return res.status(200).json({
      message: "Image uploaded and vector extracted successfully",
      data: {
        id: image[0].id,
        url: `${uploadResult.secure_url}?w=800&q=80`,
        public_id: image[0].public_id,
        vectorPreview: vector.slice(0, 5),
      },
      error: false,
      success: true,
    });
  } catch (error) {
    logger.error(`Upload error: ${error.message}`);
    return res.status(500).json({
      message: error.message || "Server error",
      error: true,
      success: false,
    });
  }
};
