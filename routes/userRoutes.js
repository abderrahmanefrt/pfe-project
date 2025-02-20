import express from "express";
import {
  
  getUser,
  updateProfile,
  updatePassword,
  deleteMyAccount,
} from "../controllers/usercontroller.js";
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();


router.get("/me", protect,getUser);
router.put("/profile",protect, updateProfile);
router.put("/password", protect, updatePassword);
router.delete("/deletemyaccount", protect, deleteMyAccount);



export default router;
