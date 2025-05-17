import express from "express";
import { protect } from "../middlewares/authMiddleware.js";

import {
  createAvis,
  getAvisByMedecin,
  deleteAvis,
  getAverageRating
} from "../controllers/avisController.js";

const router = express.Router();


router.post("/", protect, createAvis);
router.get("/:medecinId", getAvisByMedecin);
router.delete("/:id", protect, deleteAvis);
router.get('/medecin/:id/average-rating', getAverageRating);
router.get("/rating/:id", getAverageRating);


export default router;
