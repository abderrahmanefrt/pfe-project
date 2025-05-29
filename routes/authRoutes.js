import express from "express";
import multer from "multer";
import { registerUser, loginUser, registerMedecin,refreshToken,verifyOtp  } from "../controllers/authController.js";
import { loginAdmin } from "../controllers/adminAuthController.js";

import { uploadMedecinFiles } from "../middlewares/uploads.js";


const router = express.Router();

router.post("/admin-login", loginAdmin);

router.post("/register", registerUser);

router.post("/login", loginUser);
//kayen 5dma f front
router.get("/refresh-token", refreshToken);

router.post(
  "/medecin/register",
  uploadMedecinFiles,
  registerMedecin
);

router.post("/verify-otp", verifyOtp);



export default router;