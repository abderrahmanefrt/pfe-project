import express from "express";
import {
  
  getUser,
  updateProfile,
  updatePassword,
  deleteMyAccount,
  getMedicins,
  getDoctorById,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();


router.get("/me", protect,getUser);
router.put("/profile",protect, updateProfile);
router.put("/password", protect, updatePassword);
router.delete("/deletemyaccount", protect, deleteMyAccount);
router.get("/listofdoctors",protect,getMedicins)
router.get("/doctor/:id", protect, getDoctorById);



export default router;
