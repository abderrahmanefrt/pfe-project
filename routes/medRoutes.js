import express from "express";
import { protectMedecin } from "../middlewares/authMiddleware.js";
import {
  getMedc,
  updateProfile,
  updatePassword,
  deleteMyAccount,
} from "../controllers/medecinController.js";
import {
  addDisponibilite,
  getDisponibilites,
  updateDisponibilite,
  deleteDisponibilite,
} from "../controllers/availabilityController.js";


const router = express.Router();
router.get("/me", protectMedecin,getMedc);
router.put("/profile", protectMedecin, updateProfile);
router.put("/password", protectMedecin, updatePassword);
router.delete("/deletemyaccount", protectMedecin, deleteMyAccount);





router.post("/disponibilites", protectMedecin, addDisponibilite);

router.get("/disponibilites", protectMedecin, getDisponibilites);

router.put("/disponibilites/:id", protectMedecin, updateDisponibilite);

router.delete("/disponibilites/:id", protectMedecin, deleteDisponibilite);








export default router;
