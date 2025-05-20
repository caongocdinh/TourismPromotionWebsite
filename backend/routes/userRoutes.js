import express from "express"
import { addUser, getAllUsers } from "../controllers/userController.js";


const router = express.Router();

router.get("/", getAllUsers);
router.post("/add", addUser)



export default router