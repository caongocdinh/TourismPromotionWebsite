import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { sql } from "./config/db.js";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const datasetDir = "./dataset1";
const stats = { success: 0, duplicate: 0, error: 0 };
const invalidPosts = [];

// Tạo thư mục nếu chưa có
if (!fs.existsSync(datasetDir)) {
  fs.mkdirSync(datasetDir, { recursive: true });
  console.log(`📁 Đã tạo thư mục ${datasetDir}`);
}

// Hàm tính cosine similarity
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

// Kiểm tra bài viết có tồn tại không
async function postExists(postId) {
  const result = await sql`SELECT 1 FROM posts WHERE id = ${postId} LIMIT 1`;
  return result.length > 0;
}

async function isDuplicateVector(postId, newVector, threshold = 0.99) {
  const existing = await sql`
    SELECT features FROM image_vectors iv
    JOIN images i ON iv.image_id = i.id
    WHERE i.entity_type = 'post' AND i.entity_id = ${postId}
  `;
  for (const row of existing) {
    let features = row.features;
    if (typeof features === "string") {
      features = features
        .replace(/[\[\]\(\)\s]/g, "")
        .split(",")
        .map(Number);
    }
    if (features.some(isNaN) || newVector.some(isNaN)) {
      console.error("Vector có phần tử NaN!", { features, newVector });
      continue;
    }
    if (features.length !== newVector.length) {
      console.error(
        "Vector length mismatch:",
        features.length,
        newVector.length
      );
      continue;
    }
    if (cosineSimilarity(features, newVector) >= threshold) {
      console.log("⏩ Trùng vector, bỏ qua!");
      return true;
    }
  }
  return false;
}

// Upload ảnh và lưu vector
async function uploadAndSave(postId, filePath) {
  if (!(await postExists(postId))) {
    console.warn(`⚠️ Post ${postId} không tồn tại. Bỏ qua.`);
    invalidPosts.push(postId);
    stats.error++;
    return;
  }

  try {
    const uploaded = await cloudinary.uploader.upload(filePath, {
      folder: "dataset",
    });

    const form = new FormData();
    form.append("image", fs.createReadStream(filePath));
  
    let features;
  
    try {
    const res = await axios.post("http://localhost:5001/extract", form, {
      headers: form.getHeaders(),
    });

      features = res.data.features;
  
      if (!features || !Array.isArray(features) || features.some(isNaN)) {
        throw new Error("Vector không hợp lệ");
      }
    } catch (extractErr) {
      // ⚠️ Nếu lỗi khi trích vector → xoá ảnh khỏi Cloudinary
      console.error(`❌ Trích vector lỗi, xoá ảnh Cloudinary: ${filePath}`);
      await cloudinary.uploader.destroy(uploaded.public_id);
      throw extractErr; // ném lại lỗi để đếm vào stats.error
    }

    const isDup = await isDuplicateVector(postId, features);
    if (isDup) {
      console.log(`⏩ Trùng vector, bỏ qua: ${filePath}`);
      stats.duplicate++;
      // cũng có thể xoá khỏi Cloudinary nếu không muốn giữ
      await cloudinary.uploader.destroy(uploaded.public_id);
      return;
    }

    const image = await sql`
      INSERT INTO images (url, public_id, entity_type, entity_id)
      VALUES (${uploaded.secure_url}, ${uploaded.public_id}, 'post', ${postId})
      RETURNING id
    `;

    await sql`
      INSERT INTO image_vectors (image_id, features)
      VALUES (${image[0].id}, ${JSON.stringify(features)})
    `;

    console.log(`✅ Gán ảnh vào post ${postId}`);
    stats.success++;
  } catch (err) {
    console.error(`❌ Lỗi ${filePath}:`, err.message);
    stats.error++;
  }
}

// Chạy từng batch
async function processInBatches(tasks, batchSize = 5) {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.all(batch.map((task) => task()));
  }
}

// Hàm chính
async function processDataset() {
  const tasks = [];

  const posts = fs
    .readdirSync(datasetDir)
    .filter((f) => fs.statSync(path.join(datasetDir, f)).isDirectory());

  for (const postFolder of posts) {
    const postId = Number(postFolder.match(/\d+/)?.[0]);
    if (!postId) continue;

    const imgDir = path.join(datasetDir, postFolder);
    const images = fs
      .readdirSync(imgDir)
      .filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

    for (const img of images) {
      const filePath = path.join(imgDir, img);
      tasks.push(() => uploadAndSave(postId, filePath));
    }
  }

  await processInBatches(tasks, 5);

  console.log("\n📊 Kết quả:");
  console.log(`✅ Thành công: ${stats.success}`);
  console.log(`⏩ Bỏ trùng: ${stats.duplicate}`);
  console.log(`❌ Lỗi khác: ${stats.error}`);

  if (invalidPosts.length > 0) {
    const log = [...new Set(invalidPosts)].sort().join("\n");
    fs.writeFileSync("invalid_posts.txt", log);
    console.log(`📄 Đã ghi postId không tồn tại vào invalid_posts.txt`);
  }
}

// Dọn dẹp dữ liệu images và image_vectors trỏ đến bài viết không tồn tại
async function cleanupOrphanedImages() {
  try {
    console.log("🔍 Đang kiểm tra và dọn dẹp dữ liệu images...");
    
    // Tìm images trỏ đến bài viết không tồn tại
    const orphanedImages = await sql`
      SELECT i.id, i.entity_id, i.url, i.entity_type
      FROM images i
      LEFT JOIN posts p ON i.entity_type = 'post' AND i.entity_id = p.id
      WHERE i.entity_type = 'post' AND p.id IS NULL
    `;
    
    if (orphanedImages.length === 0) {
      console.log("✅ Không có dữ liệu images bị orphaned");
      return;
    }
    
    console.log(`⚠️  Tìm thấy ${orphanedImages.length} images trỏ đến bài viết không tồn tại:`);
    orphanedImages.forEach(img => {
      console.log(`   - Image ID: ${img.id}, Entity ID: ${img.entity_id}, URL: ${img.url}`);
    });
    
    // Xóa image_vectors trước
    const imageIds = orphanedImages.map(img => img.id);
    await sql`DELETE FROM image_vectors WHERE image_id = ANY(${imageIds})`;
    console.log(`🗑️  Đã xóa ${imageIds.length} image_vectors`);
    
    // Xóa images
    await sql`DELETE FROM images WHERE id = ANY(${imageIds})`;
    console.log(`🗑️  Đã xóa ${imageIds.length} images`);
    
    console.log("✅ Dọn dẹp hoàn tất!");
    
  } catch (error) {
    console.error("❌ Lỗi khi dọn dẹp:", error);
  }
}

// Kiểm tra tính toàn vẹn dữ liệu
async function checkDataIntegrity() {
  try {
    console.log("🔍 Đang kiểm tra tính toàn vẹn dữ liệu...");
    
    // Kiểm tra images không có vector
    const imagesWithoutVectors = await sql`
      SELECT i.id, i.entity_id, i.url
      FROM images i
      LEFT JOIN image_vectors iv ON i.id = iv.image_id
      WHERE iv.image_id IS NULL
    `;
    
    if (imagesWithoutVectors.length > 0) {
      console.log(`⚠️  Tìm thấy ${imagesWithoutVectors.length} images không có vector:`);
      imagesWithoutVectors.forEach(img => {
        console.log(`   - Image ID: ${img.id}, Entity ID: ${img.entity_id}, URL: ${img.url}`);
      });
    } else {
      console.log("✅ Tất cả images đều có vector");
    }
    
    // Kiểm tra vectors không có image
    const vectorsWithoutImages = await sql`
      SELECT iv.image_id
      FROM image_vectors iv
      LEFT JOIN images i ON iv.image_id = i.id
      WHERE i.id IS NULL
    `;
    
    if (vectorsWithoutImages.length > 0) {
      console.log(`⚠️  Tìm thấy ${vectorsWithoutImages.length} vectors không có image`);
      await sql`DELETE FROM image_vectors WHERE image_id IN (
        SELECT iv.image_id
        FROM image_vectors iv
        LEFT JOIN images i ON iv.image_id = i.id
        WHERE i.id IS NULL
      )`;
      console.log("🗑️  Đã xóa vectors orphaned");
    } else {
      console.log("✅ Tất cả vectors đều có image");
    }
    
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra tính toàn vẹn:", error);
  }
}

// Tạo lại vector cho images không có vector
async function regenerateMissingVectors() {
  try {
    console.log("🔍 Đang tìm images không có vector...");
    
    const imagesWithoutVectors = await sql`
      SELECT i.id, i.entity_id, i.url, i.public_id
      FROM images i
      LEFT JOIN image_vectors iv ON i.id = iv.image_id
      WHERE iv.image_id IS NULL
    `;
    
    if (imagesWithoutVectors.length === 0) {
      console.log("✅ Tất cả images đều có vector");
      return;
    }
    
    console.log(`⚠️  Tìm thấy ${imagesWithoutVectors.length} images không có vector. Bắt đầu tạo lại...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const img of imagesWithoutVectors) {
      try {
        console.log(`🔄 Đang xử lý image ID: ${img.id}, URL: ${img.url}`);
        
        // Download image từ Cloudinary
        const response = await axios.get(img.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        // Tạo FormData
        const formData = new FormData();
        formData.append('image', buffer, {
          filename: 'image.jpg',
          contentType: 'image/jpeg',
        });
        
        // Gọi Flask API để extract features
        const flaskResponse = await axios.post(
          "http://localhost:5001/extract",
          formData,
          { headers: { ...formData.getHeaders() } }
        );
        
        const features = flaskResponse.data.features;
        if (!features || !Array.isArray(features)) {
          throw new Error("Invalid features response");
        }
        
        // Lưu vector vào database
        await sql`
          INSERT INTO image_vectors (image_id, features)
          VALUES (${img.id}, ${JSON.stringify(features)})
        `;
        
        console.log(`✅ Đã tạo vector cho image ID: ${img.id}`);
        successCount++;
        
        // Delay nhỏ để tránh quá tải
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý image ID ${img.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Kết quả tạo vector:`);
    console.log(`   ✅ Thành công: ${successCount}`);
    console.log(`   ❌ Lỗi: ${errorCount}`);
    
  } catch (error) {
    console.error("❌ Lỗi khi tạo lại vector:", error);
  }
}

// Chạy các hàm kiểm tra và dọn dẹp
async function main() {
  try {
    await checkDataIntegrity();
    await cleanupOrphanedImages();
    await regenerateMissingVectors(); // Tạo lại vector cho images còn thiếu
    // await processDataset(); // Uncomment nếu muốn chạy lại dataset
  } catch (error) {
    console.error("❌ Lỗi trong main:", error);
  } finally {
    process.exit(0);
  }
}

main();
