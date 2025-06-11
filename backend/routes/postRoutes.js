import express from "express";
import upload from "../middlewares/upload.js";
import {
  getAllPosts,
  addPost,
  getPostById,
  approvePost,
  rejectPost,
  updatePost, getUserPosts,
  getPostsByCategory, 
  incrementPostView, 
  searchPosts,
  getPendingPosts
} from "../controllers/postController.js";
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get("/", getAllPosts);
router.get("/search", searchPosts);
router.get("/user", protect, authorize('user', 'admin'), getUserPosts);
router.post("/add", protect, authorize('user', 'admin'), upload.array('images'), addPost);
router.get("/:id", getPostById);
router.post('/view/:id', incrementPostView);
router.put("/approve/:id", protect, authorize('admin'), approvePost);
router.put("/reject/:id", protect, authorize('admin'), rejectPost);
router.put("/:id", protect, authorize('user', 'admin'), updatePost); // Thêm route mới
router.get('/posts/category', getPostsByCategory);
router.get("/posts/pending", protect, authorize("admin"), getPendingPosts);

export default router;