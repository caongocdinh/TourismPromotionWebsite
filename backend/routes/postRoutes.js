import express from "express";
import upload from "../middlewares/upload.js";
import {
  getAllPosts,
  addPost,
  getPostById,
} from "../controllers/postController.js";
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get("/", getAllPosts);
router.post("/add",protect, authorize('user', 'admin'), upload.array('images'),addPost);
router.get("/:id", getPostById);
export default router;
