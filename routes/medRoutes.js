import express from "express";
import { protect, protectMedecin } from "../middlewares/authMiddleware.js";
import {
  getMedc,
  updateProfile,
  updatePassword,
  deleteMyAccount,
  searchMedecins,
  getMedecinsProches,
} from "../controllers/medecinController.js";
import {
  addDisponibilite,
  getDisponibilites,
  updateDisponibilite,
  deleteDisponibilite,
} from "../controllers/availabilityController.js";


const router = express.Router();
router.get("/me", getMedc);
router.put("/profile", protectMedecin, updateProfile);
router.put("/password", protectMedecin, updatePassword);
router.delete("/deletemyaccount", protectMedecin, deleteMyAccount);
router.get("/SearchMedecin",searchMedecins);
router.get("/nearMedecin",protect,getMedecinsProches);

router.post("/disponibilites", protectMedecin, addDisponibilite);

router.get("/disponibilites", protectMedecin, getDisponibilites);

router.put("/disponibilites/:id", protectMedecin, updateDisponibilite);

router.delete("/disponibilites/:id", protectMedecin, deleteDisponibilite);








export default router;
