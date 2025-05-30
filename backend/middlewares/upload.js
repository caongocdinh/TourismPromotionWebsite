// import multer from "multer";

// const upload = multer({
//   storage: multer.memoryStorage(),
//   fileFilter: (req, file, cb) => {
//     if (!file.mimetype.startsWith("image/")) {
//       return cb(new Error("Chỉ hỗ trợ file ảnh"));
//     }
//     cb(null, true);
//   },
// });

// export default upload;


// src/middlewares/upload.js
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format (only JPEG, PNG, GIF allowed)'), false);
    }
  },
});

export default upload;
