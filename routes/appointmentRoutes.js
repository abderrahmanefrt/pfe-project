import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  approveAppointment,
  rejectAppointment,
} from "../controllers/appointmentController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createAppointment);
router.get("/", protect, admin, getAllAppointments);
router.get("/:id", protect, getAppointmentById);
router.put("/:id", protect, updateAppointment);
router.delete("/:id", protect, deleteAppointment);

// Admin-only routes
router.put("/:id/approve", protect, admin, approveAppointment);
router.put("/:id/reject", protect, admin, rejectAppointment);

export default router;
