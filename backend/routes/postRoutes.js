import express from "express";
import upload from "../middlewares/upload.js";
import {
  getAllPosts,
  addPost,
  getPostById,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", getAllPosts);
router.post("/add", upload.array('images'),addPost);
router.get("/:id", getPostById);
export default router;
