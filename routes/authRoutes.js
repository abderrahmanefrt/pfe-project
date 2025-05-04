import express from "express";
import multer from "multer";
import { registerUser, loginUser, registerMedecin,refreshToken  } from "../controllers/authController.js";
import { loginAdmin } from "../controllers/adminAuthController.js";
import upload from "../middlewares/uploads.js"; 

const router = express.Router();

router.post("/admin-login", loginAdmin);

router.post("/register", registerUser);

router.post("/login", loginUser);
//kayen 5dma f front
router.get("/refresh-token", refreshToken);

router.post(
  "/medecin/register",
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "photo", maxCount: 1 }
  ]),
  registerMedecin
);


export default router;
