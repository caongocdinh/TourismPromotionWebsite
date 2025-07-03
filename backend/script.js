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

processDataset();
