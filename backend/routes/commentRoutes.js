import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { addComment, getCommentsByPost, deleteComment, updateComment } from "../controllers/commentController.js";

const router = express.Router();

router.post("/add", protect, authorize("user", "admin"), addComment);
router.get("/post/:post_id", protect, authorize("user", "admin"), getCommentsByPost);
router.delete("/:comment_id", protect, authorize("user", "admin"), deleteComment);

// Sửa bình luận
router.put("/:comment_id", protect, authorize("user", "admin"), updateComment);

export default router;