// const express = require('express');
// const multer = require('multer');
// const ImageController = require('../controllers/imageController');


// const router = express.Router();
// const upload = multer({ dest: 'uploads/' });

// router.post('/search', upload.single('image'), ImageController.search);

// export default router;


// import auth from "../middleware/auth.js";
import { Router } from "express";


import { uploadImageController, searchSimilarImages, checkDuplicateVector, saveVector, deleteImage } from "../controllers/ImageController.js";
import upload from "../middlewares/upload.js";

const router = Router()

router.post("/upload",upload.single("image"), uploadImageController)
router.post("/search",upload.single("image"), searchSimilarImages)
router.post("/check-duplicate", checkDuplicateVector)
router.post("/save-vector", saveVector)
router.delete("/:id", deleteImage)

export default router
