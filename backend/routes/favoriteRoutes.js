import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import { addFavorite, getFavorites, removeFavorite } from "../controllers/favoriteController.js";

const router = express.Router();

// Thêm bài viết vào danh sách yêu thích
router.post("/add", protect, authorize("user", "admin"), addFavorite);

// Lấy danh sách bài viết yêu thích
router.get("/", protect, authorize("user", "admin"), getFavorites);

// Xóa bài viết khỏi danh sách yêu thích
router.delete("/:post_id", protect, authorize("user", "admin"), removeFavorite);

export default router;