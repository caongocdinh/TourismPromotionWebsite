import express from "express";
import {
  addLocation,
  getAllLocations,
  getLocationBySlug
} from "../controllers/locationController.js";

const router = express.Router();

router.post("/add", addLocation);
router.get("/", getAllLocations);
router.get("/:slug", getLocationBySlug); 

export default router;
