import express from "express";
import multer from "multer";
import { registerUser, loginUser, registerMedecin, loginMedecin } from "../controllers/authController.js";
import { loginAdmin } from "../controllers/adminAuthController.js";
import upload from "../middlewares/uploads.js"; 

const router = express.Router();

router.post("/admin-login", loginAdmin);

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/medecin/register", upload.single("document"), registerMedecin);

router.post("/medecin/login", loginMedecin);

export default router;
