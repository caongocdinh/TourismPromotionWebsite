import axios from 'axios';
import { sql } from "../config/db.js";
import uploadImageCloudinary from "../utils/cloundinary.js";
import logger from "../utils/logger.js";
import FormData from 'form-data';

// Tìm kiếm ảnh tương tự
export const searchSimilarImages = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "No image provided",
        error: true,
        success: false,
      });
    }

    // Extract features từ ảnh query
    const formData = new FormData();
    formData.append('image', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const flaskResponse = await axios.post(
      "http://localhost:5001/extract",
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    const queryVector = flaskResponse.data.features;
    const k = req.body.k || 10;

    // Lấy tất cả vectors từ database
    const allVectors = await sql`
      SELECT iv.image_id, iv.features, i.url, i.entity_type
      FROM image_vectors iv
      JOIN images i ON iv.image_id = i.id
    `;

    // Tính cosine similarity
    const similarities = allVectors.map(row => {
      const storedVector = JSON.parse(row.features);
      const similarity = cosineSimilarity(queryVector, storedVector);
      
      return {
        image_id: row.image_id,
        url: row.url,
        similarity: similarity,
        entity_type: row.entity_type
      };
    });

    // Sắp xếp và lấy top-k
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, k);

    return res.status(200).json({
      message: "Search completed successfully",
      data: {
        results: topResults,
        total_found: similarities.length,
        query_stats: {
          k: k,
          vector_dimension: queryVector.length
        }
      },
      error: false,
      success: true,
    });

  } catch (error) {
    logger.error(`Search error: ${error.message}`);
    return res.status(500).json({
      message: error.message || "Server error",
      error: true,
      success: false,
    });
  }
};

// Hàm tính cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

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
