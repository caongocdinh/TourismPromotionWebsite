import express from "express";
import { addTouristPlace, getAllTouristPlaces } from "../controllers/touristPlaceController.js";

const router = express.Router();

router.post("/add", addTouristPlace);
router.get("/", getAllTouristPlaces);

export default router;