import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createAvis,
  getAvisByMedecin,
  deleteAvis,
} from "../controllers/avisController.js";

const router = express.Router();


router.post("/", protect, createAvis);
router.get("/:medecinId", getAvisByMedecin);
router.delete("/:id", protect, deleteAvis);

export default router;
