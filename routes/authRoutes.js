import express from "express";
import { registerUser, loginUser, registerMedecin, verifyOtp } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploads.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);


router.post(
  "/medecin/register",
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "photo", maxCount: 1 }
  ]),
  registerMedecin
);

router.post("/verify-otp", verifyOtp);





export default router;