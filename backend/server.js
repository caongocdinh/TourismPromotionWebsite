import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from "cloudinary";
import { sql } from "./config/db.js";
import userRouters from "./routes/userRoutes.js";
import postRouters from "./routes/postRoutes.js";
import touristPlaceRoutes from "./routes/touristPlaceRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import imageRoutes from "./routes/imageRoutes.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/users", userRouters);
app.use("/api/posts", postRouters);
app.use("/api/tourist_places", touristPlaceRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/categories", categoryRoutes);
app.use('/api/images', imageRoutes);

async function initDB() {
  try {
    // Tạo bảng users
    const userTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      )
    `;
    if (!userTableExists[0].exists) {
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Tạo bảng users thành công!");
    } else {
      const roleColumnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
        )
      `;
      if (!roleColumnExists[0].exists) {
        await sql`
          ALTER TABLE users
          ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'
        `;
        console.log("Thêm cột role vào bảng users thành công!");
      } else {
        console.log("Cột role đã tồn tại trong bảng users.");
      }
    }

    // Tạo bảng locations
    const locationTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'locations'
      )
    `;
    if (!locationTableExists[0].exists) {
      await sql`
        CREATE TABLE locations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Tạo bảng locations thành công!");
    } else {
      console.log("Bảng locations đã tồn tại.");
    }

    // Tạo bảng tourist_places
    const touristPlaceTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tourist_places'
      )
    `;
    if (!touristPlaceTableExists[0].exists) {
      await sql`
        CREATE TABLE tourist_places (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          location_id INTEGER NOT NULL REFERENCES locations(id),
          longitude NUMERIC(10, 7),
          latitude NUMERIC(10, 7),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Tạo bảng tourist_places thành công!");
    } else {
      console.log("Bảng tourist_places đã tồn tại.");
    }

    // Tạo bảng categories
    const categoryTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'categories'
      )
    `;
    if (!categoryTableExists[0].exists) {
      await sql`
        CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Tạo bảng categories thành công!");
    } else {
      console.log("Bảng categories đã tồn tại.");
    }

    // Tạo bảng posts
    const postTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'posts'
      )
    `;
    if (!postTableExists[0].exists) {
      await sql`
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          tourist_place_id INTEGER NOT NULL REFERENCES tourist_places(id),
          status VARCHAR(20) NOT NULL DEFAULT 'pending', -- Thêm cột status
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Tạo bảng posts thành công!");
    } else {
      const statusColumnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'status'
        )
      `;
      if (!statusColumnExists[0].exists) {
        await sql`
          ALTER TABLE posts
          ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
        `;
        console.log("Thêm cột status vào bảng posts thành công!");
      } else {
        console.log("Cột status đã tồn tại trong bảng posts.");
      }
    }

    // Tạo bảng post_categories
    const postCategoryTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'post_categories'
      )
    `;
    if (!postCategoryTableExists[0].exists) {
      await sql`
        CREATE TABLE post_categories (
          post_id INTEGER NOT NULL REFERENCES posts(id),
          category_id INTEGER NOT NULL REFERENCES categories(id),
          PRIMARY KEY (post_id, category_id)
        )
      `;
      console.log("Tạo bảng post_categories thành công!");
    } else {
      console.log("Bảng post_categories đã tồn tại.");
    }

    // Tạo bảng images
    const imageTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'images'
      )
    `;
    if (!imageTableExists[0].exists) {
      await sql`
        CREATE TABLE images (
          id SERIAL PRIMARY KEY,
          url VARCHAR(255) NOT NULL,
          public_id VARCHAR(255) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Tạo bảng images thành công!");
    } else {
      console.log("Bảng images đã tồn tại.");
    }
  } catch (error) {
    console.error("Lỗi khi khởi tạo cơ sở dữ liệu:", error.stack);
    throw error;
  }
}

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server has started on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Không thể khởi động server do lỗi initDB:", error.stack);
  });