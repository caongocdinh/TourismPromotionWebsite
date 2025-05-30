// backend/routes/postRoutes.js
import express from "express";
import upload from "../middlewares/upload.js";
import {
  getAllPosts,
  addPost,
  getPostById,
} from "../controllers/postController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Route công khai (guest, user, admin)
router.get("/", protect, authorize('guest', 'user', 'admin'), getAllPosts);
router.get("/:id", protect, authorize('guest', 'user', 'admin'), getPostById);

// Route bảo vệ (chỉ user hoặc admin)
router.post("/add", protect, authorize('user', 'admin'), upload.array('images'), addPost);



export default router;