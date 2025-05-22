import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ hỗ trợ file ảnh"));
    }
    cb(null, true);
  },
});

export default upload;