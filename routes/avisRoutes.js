import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { admin } from "../middlewares/authMiddleware.js"; 


import {
  createAvis,
  getAvisByMedecin,
  deleteAvis,
  getAverageRating,
  getPendingAvis,
  updateAvisStatus
} from "../controllers/avisController.js";

const router = express.Router();


router.post("/", protect, createAvis);
router.get("/pending",admin , getPendingAvis);
router.get("/:medecinId", getAvisByMedecin);
router.delete("/:id", protect, deleteAvis);
router.get('/medecin/:id/average-rating', getAverageRating);
router.get("/rating/:id", getAverageRating);

router.put("/:id/status", admin, updateAvisStatus);


export default router;
