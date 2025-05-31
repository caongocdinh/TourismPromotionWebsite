import tf from '@tensorflow/tfjs';
import mobilenet from '@tensorflow-models/mobilenet';
import { Pool } from 'pg';
import fs from 'fs';

const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    ssl: { require: true, rejectUnauthorized: false },
});

let model;
(async () => {
    model = await mobilenet.load();
})();

class Image {
    static async initializeDatabase() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS images (
                id SERIAL PRIMARY KEY,
                image_path TEXT NOT NULL,
                feature_vector FLOAT[] NOT NULL
            );
        `);
    }

    static async extractFeatures(imagePath) {
        const image = fs.readFileSync(imagePath);
        const tensor = tf.node.decodeImage(image).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
        const features = model.infer(tensor, true);
        return features.arraySync().flat();
    }

    static async preprocessDataset(datasetPath) {
        const files = fs.readdirSync(datasetPath);
        for (const file of files) {
            const imagePath = `${datasetPath}/${file}`;
            const features = await this.extractFeatures(imagePath);
            await pool.query(
                'INSERT INTO images (image_path, feature_vector) VALUES ($1, $2)',
                [imagePath, features]
            );
        }
    }

    static async searchSimilarImages(queryFeatures) {
        const result = await pool.query(
            `SELECT image_path, 
                    (SELECT sqrt(sum(power(unnest(feature_vector) - unnest($1::float[]), 2))) AS distance 
                     FROM images 
                     ORDER BY distance 
                     LIMIT 5)`,
            [queryFeatures]
        );
        return result.rows.map(row => row.image_path);
    }
}

export default Image;
