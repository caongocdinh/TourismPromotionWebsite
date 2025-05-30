import fs from 'fs';
import axios from 'axios';
import { Pool } from 'pg';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    ssl: { require: true, rejectUnauthorized: false },
});

class Image {
    static async initializeDatabase() {
        try {
            // Tạo bảng users
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    role VARCHAR(50) DEFAULT 'user',
                    password VARCHAR(255) NOT NULL,
                    status VARCHAR(50) DEFAULT 'active',
                    avt VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Tạo bảng categories
            await pool.query(`
                CREATE TABLE IF NOT EXISTS categories (
                    category_id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL
                );
            `);

            // Tạo bảng locations
            await pool.query(`
                CREATE TABLE IF NOT EXISTS locations (
                    location_id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT
                );
            `);

            // Tạo bảng tourist_places
            await pool.query(`
                CREATE TABLE IF NOT EXISTS tourist_places (
                    tourist_place_id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    longitude FLOAT,
                    latitude FLOAT,
                    location_id INT,
                    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL
                );
            `);

            // Tạo bảng articles
            await pool.query(`
                CREATE TABLE IF NOT EXISTS articles (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    content TEXT,
                    status VARCHAR(50),
                    user_id INT,
                    tourist_place_id INT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (tourist_place_id) REFERENCES tourist_places(tourist_place_id) ON DELETE SET NULL
                );
            `);

            // Tạo bảng images
            await pool.query(`
                CREATE TABLE IF NOT EXISTS images (
                    image_id SERIAL PRIMARY KEY,
                    imageUrl TEXT NOT NULL,
                    article_id INT,
                    tourist_place_id INT,
                    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
                    FOREIGN KEY (tourist_place_id) REFERENCES tourist_places(tourist_place_id) ON DELETE SET NULL
                );
            `);

            // Tạo bảng image_vectors
            await pool.query(`
                CREATE TABLE IF NOT EXISTS image_vectors (
                    image_vector_id SERIAL PRIMARY KEY,
                    vector_image FLOAT[] NOT NULL,
                    image_id INT,
                    FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE
                );
            `);

            // Tạo bảng comments
            await pool.query(`
                CREATE TABLE IF NOT EXISTS comments (
                    comment_id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    user_id INT,
                    article_id INT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
                );
            `);

            console.log('Tất cả các bảng đã được tạo thành công!');
        } catch (error) {
            console.error('Lỗi khi tạo bảng:', error.stack);
            throw error;
        }
    }

    static async extractFeatures(imagePath) {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(imagePath));
            const response = await axios.post('https://6a5c-35-240-227-116.ngrok-free.app/extract-features', formData, {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            return response.data.features;
        } catch (error) {
            console.error('Lỗi trích xuất đặc trưng:', error.message);
            throw error;
        }
    }

    static async preprocessDataset(datasetPath) {
        try {
            const response = await axios.post(`https://6a5c-35-240-227-116.ngrok-free.app/preprocess-dataset?dataset_path=./dataset/dataset`);
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            const featuresData = response.data.features_data;

            for (const [imagePath, features] of featuresData) {
                const imageRes = await pool.query(
                    'INSERT INTO images (imageUrl) VALUES ($1) RETURNING image_id',
                    [imagePath]
                );
                const imageId = imageRes.rows[0].image_id;

                await pool.query(
                    'INSERT INTO image_vectors (vector_image, image_id) VALUES ($1, $2)',
                    [features, imageId]
                );
            }
            console.log('Tiền xử lý dataset hoàn tất');

            // Kiểm tra số lượng bản ghi trong database
            const imageCount = await pool.query('SELECT COUNT(*) FROM images');
            console.log('Số lượng ảnh trong bảng images:', imageCount.rows[0].count);
            const vectorCount = await pool.query('SELECT COUNT(*) FROM image_vectors');
            console.log('Số lượng vector trong bảng image_vectors:', vectorCount.rows[0].count);
        } catch (error) {
            console.error('Lỗi tiền xử lý dataset:', error.message);
            throw error;
        }
    }

    static async searchSimilarImages(queryFeatures) {
        try {
            const result = await pool.query(
                `SELECT i.image_id, i.imageUrl, 
                        (SELECT sqrt(sum(power(unnest(iv.vector_image) - unnest($1::float[]), 2))) AS distance)
                FROM images i
                JOIN image_vectors iv ON i.image_id = iv.image_id
                ORDER BY distance
                LIMIT 5`,
                [queryFeatures]
            );
            return result.rows.map(row => ({ image_id: row.image_id, imageUrl: row.imageUrl }));
        } catch (error) {
            console.error('Lỗi tìm kiếm ảnh tương tự:', error.message);
            throw error;
        }
    }
}

export default Image;

// Khởi tạo database và tiền xử lý dataset
Image.initializeDatabase().then(() => {
    Image.preprocessDataset('dataset').catch(err => console.error('Lỗi tiền xử lý dataset:', err));
});
