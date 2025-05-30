// const express = require('express');
// const multer = require('multer');
// const ImageController = require('../controllers/imageController');


// const router = express.Router();
// const upload = multer({ dest: 'uploads/' });

// router.post('/search', upload.single('image'), ImageController.search);

// export default router;


// import auth from "../middleware/auth.js";
import { Router } from "express";

import upload from "../middlewares/upload.js";
import { uploadImageController } from "../controllers/ImageController.js";

const router = Router()

router.post("/upload",upload.single("image"), uploadImageController)

export default router