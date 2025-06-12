import express from "express";
import upload from "../middlewares/upload.js";
import {
  getAllPosts,
  addPost,
  getPostById,
  approvePost,
  rejectPost,
  updatePost,
  getUserPosts,
  getPostsByCategory,
  searchPostsByImage,
} from "../controllers/postController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getAllPosts);
router.get("/user", protect, authorize("user", "admin"), getUserPosts);
router.post(
  "/add",
  protect,
  authorize("user", "admin"),
  upload.array("images"),
  addPost
);
router.get("/:id", getPostById);
router.put("/approve/:id", protect, authorize("admin"), approvePost);
router.put("/reject/:id", protect, authorize("admin"), rejectPost);
router.put("/:id", protect, authorize("user", "admin"), updatePost); // Thêm route mới
router.get("/posts/category", getPostsByCategory);
router.post("/search-posts-by-image", searchPostsByImage);

export default router;
