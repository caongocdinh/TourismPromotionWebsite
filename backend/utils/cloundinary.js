
// src/utils/uploadImageCloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageCloudinary = async (image, folder = 'tourism_posts') => {
  try {
    const buffer = image.buffer;
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(buffer);
    });
    return uploadResult;
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    throw error;
  }
};

export default uploadImageCloudinary;
