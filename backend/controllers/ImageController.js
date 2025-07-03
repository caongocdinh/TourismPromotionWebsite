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

// Xóa ảnh và vector đặc trưng
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin ảnh trước khi xóa
    const image = await sql`SELECT public_id FROM images WHERE id = ${id}`;
    if (image.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ảnh"
      });
    }

    // Xóa vector đặc trưng trước
    await sql`DELETE FROM image_vectors WHERE image_id = ${id}`;
    
    // Xóa ảnh khỏi database
    await sql`DELETE FROM images WHERE id = ${id}`;

    // Xóa ảnh khỏi Cloudinary (nếu cần)
    if (image[0].public_id) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        await cloudinary.uploader.destroy(image[0].public_id);
      } catch (cloudinaryError) {
        console.error("Lỗi khi xóa ảnh khỏi Cloudinary:", cloudinaryError);
        // Vẫn trả về thành công vì đã xóa khỏi database
      }
    }

    res.status(200).json({
      success: true,
      message: "Xóa ảnh thành công"
    });

  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa ảnh"
    });
  }
};

export const uploadImageController = async (req, res) => {
  console.log("FILE RECEIVED:", req.file);
  try {
    const file = req.file;
    const { postId } = req.query; // Lấy postId từ query params
    const folder = req.query.folder || "tourism_posts"; // Folder tùy chọn

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

    // Trích xuất vector đặc trưng trước
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

    const vector = flaskResponse.data.features;
    if (!vector || !Array.isArray(vector)) {
      return res.status(400).json({
        message: "Không thể trích xuất đặc trưng ảnh",
        error: true,
        success: false,
      });
    }

    // Kiểm tra trùng lặp vector nếu có postId
    if (postId) {
      const existingVectors = await sql`
        SELECT features FROM image_vectors iv
        JOIN images i ON iv.image_id = i.id
        WHERE i.entity_type = 'post' AND i.entity_id = ${parseInt(postId)}
      `;

      const threshold = 0.99;
      for (const row of existingVectors) {
        let storedFeatures = row.features;
        if (typeof storedFeatures === "string") {
          storedFeatures = JSON.parse(storedFeatures);
        }
        
        if (storedFeatures.length === vector.length) {
          const similarity = cosineSimilarity(vector, storedFeatures);
          if (similarity >= threshold) {
            return res.status(400).json({
              message: "Ảnh này đã tồn tại trong bài viết (trùng lặp)",
              error: true,
              success: false,
              isDuplicate: true
            });
          }
        }
      }
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImageCloudinary(file, folder);
    logger.info(`Image uploaded: ${uploadResult.secure_url}`);

    // Xác định entity_type và entity_id
    const entityType = postId ? 'post' : 'temp';
    const entityId = postId ? parseInt(postId) : 0;

    // Store in images table
    const image = await sql`
      INSERT INTO images (url, public_id, entity_type, entity_id)
      VALUES (${uploadResult.secure_url}, ${uploadResult.public_id}, ${entityType}, ${entityId})
      RETURNING id, url, public_id
    `;

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

// Kiểm tra trùng lặp vector
export const checkDuplicateVector = async (req, res) => {
  try {
    const { postId, features } = req.body;

    if (!postId || !features || !Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        message: "Missing postId or features",
      });
    }

    // Lấy các vector hiện có của bài viết
    const existingVectors = await sql`
      SELECT features FROM image_vectors iv
      JOIN images i ON iv.image_id = i.id
      WHERE i.entity_type = 'post' AND i.entity_id = ${postId}
    `;

    // Kiểm tra trùng lặp với ngưỡng 0.99
    const threshold = 0.99;
    for (const row of existingVectors) {
      let storedFeatures = row.features;
      if (typeof storedFeatures === "string") {
        storedFeatures = JSON.parse(storedFeatures);
      }
      
      if (storedFeatures.length === features.length) {
        const similarity = cosineSimilarity(features, storedFeatures);
        if (similarity >= threshold) {
          return res.status(200).json({
            success: true,
            isDuplicate: true,
            similarity: similarity
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      isDuplicate: false
    });

  } catch (error) {
    console.error("Error checking duplicate vector:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Lưu vector đặc trưng
export const saveVector = async (req, res) => {
  try {
    const { imageId, features } = req.body;

    if (!imageId || !features) {
      return res.status(400).json({
        success: false,
        message: "Missing imageId or features",
      });
    }

    await sql`
      INSERT INTO image_vectors (image_id, features)
      VALUES (${imageId}, ${features})
    `;

    res.status(200).json({
      success: true,
      message: "Vector saved successfully"
    });

  } catch (error) {
    console.error("Error saving vector:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
