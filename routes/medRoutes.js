import express from "express";
import { protectMedecin } from "../middlewares/authMiddleware.js";
import {
  updateProfile,
  updatePassword,
  deleteMyAccount,
} from "../controllers/medecinController.js";


const router = express.Router();

router.put("/profile", protectMedecin, updateProfile);
router.put("/password", protectMedecin, updatePassword);
router.delete("/deletemyaccount", protectMedecin, deleteMyAccount);

export default router;
