import fs from 'fs';
import axios from 'axios';

class Image {
    static async preprocessDataset(datasetPath) {
        try {
            const response = await axios.post(`https://6a5c-35-240-227-116.ngrok-free.app/preprocess-dataset?dataset_path=${datasetPath}`);
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
        } catch (error) {
            console.error('Lỗi tiền xử lý dataset:', error.message);
            throw error;
        }
    }
}

export default Image;

// Run preprocessing
Image.preprocessDataset('dataset');