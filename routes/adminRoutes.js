import express from "express";
import {
  getAllMedecins, getMedecinById,  updateMedecin, deleteMedecin,
  getPendingMedecins, approveMedecin, rejectMedecin,
  getAllUsers, getUserById, blockUser, deleteUser, 
  getAllAvis, deleteAvis ,getAdminStats 
} from "../controllers/adminController.js";
import { admin } from "../middlewares/authMiddleware.js"; 
import { protect } from "../middlewares/authMiddleware.js";
import { uploadMedecinFiles } from "../middlewares/uploads.js";
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** MÉDECINS */
router.get("/medecins", getAllMedecins);
router.get("/medecins/:id",protect, admin, getMedecinById);
router.put("/medecins/:id", protect,admin, uploadMedecinFiles, updateMedecin);
router.delete("/medecins/:id",protect, admin, deleteMedecin);
router.get("/medecins-pending",protect, admin, getPendingMedecins);
router.put("/medecins/:id/approve",protect, admin, approveMedecin);
router.put("/medecins/:id/reject",protect, admin, rejectMedecin);

/** UTILISATEURS */
router.get("/users", protect, admin, getAllUsers);
router.get("/users/:id", protect,admin, getUserById);

router.put("/users/:id/block", protect,admin, blockUser);
router.delete("/users/:id", protect,admin, deleteUser);

/** AVIS */
router.get("/avis", protect,admin, getAllAvis);
router.delete("/avis/:id", protect,admin, deleteAvis);

router.get("/stats", protect, admin, getAdminStats);

// Route de test pour Cloudinary
router.get('/test-cloudinary', async (req, res) => {
  try {
    // Utiliser une image existante
    const testImagePath = path.join(__dirname, '..', 'uploads', 'photos', '1748169494929.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      return res.status(404).json({ error: "Image de test non trouvée" });
    }

    console.log("📤 Upload de l'image vers Cloudinary...");
    const result = await cloudinary.uploader.upload(testImagePath, {
      folder: 'medecins/photos',
      resource_type: 'image'
    });

    console.log("✅ Upload réussi:", result.secure_url);
    res.json({
      message: "Test Cloudinary réussi",
      url: result.secure_url,
      details: result
    });
  } catch (error) {
    console.error("❌ Erreur lors du test Cloudinary:", error);
    res.status(500).json({
      error: "Erreur lors du test Cloudinary",
      details: error.message
    });
  }
});

export default router;
