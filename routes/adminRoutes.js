import express from "express";
import {
  getAllMedecins, getMedecinById, createMedecin, updateMedecin, deleteMedecin,
  getPendingMedecins, approveMedecin, rejectMedecin,
  getAllUsers, getUserById, blockUser, deleteUser, createUser,
  getAllAvis, deleteAvis
} from "../controllers/adminController.js";
import { admin } from "../middlewares/authMiddleware.js"; 
import { protect } from "../middlewares/authMiddleware.js";


const router = express.Router();

/** MÉDECINS */
router.get("/medecins", protect,admin, getAllMedecins);
router.get("/medecins/:id",protect, admin, getMedecinById);
router.post("/medecins", protect,admin, createMedecin);
router.put("/medecins/:id", protect,admin, updateMedecin);
router.delete("/medecins/:id",protect, admin, deleteMedecin);
router.get("/medecins-pending",protect, admin, getPendingMedecins);
router.put("/medecins/:id/approve",protect, admin, approveMedecin);
router.put("/medecins/:id/reject",protect, admin, rejectMedecin);

/** UTILISATEURS */
router.get("/users", protect, admin, getAllUsers);
router.get("/users/:id", protect,admin, getUserById);
router.post("/users", protect,admin, createUser);
router.put("/users/:id/block", protect,admin, blockUser);
router.delete("/users/:id", protect,admin, deleteUser);

/** AVIS */
router.get("/avis", protect,admin, getAllAvis);
router.delete("/avis/:id", protect,admin, deleteAvis);

export default router;
