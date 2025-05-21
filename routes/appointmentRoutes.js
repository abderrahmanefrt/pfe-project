import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  approveAppointment,
  rejectAppointment,
  getMedecinAppointments,
  updateAppointmentStatus,
  getBookedAppointments,
  getAcceptedAppointments,
  deleteAppointmentByDoctor
} from "../controllers/appointmentController.js";
import { protect, admin,protectMedecin ,patientOrAdmin} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createAppointment);
router.get("/", protect, patientOrAdmin, getAllAppointments); 
router.get("/booked", protect, getBookedAppointments);

router.put("/:id", protect, updateAppointment);
router.delete("/:id", protect, deleteAppointment);

// Admin-only routes
router.put("/:id/approve", protect, admin, approveAppointment);
router.put("/:id/reject", protect, admin, rejectAppointment);

router.get("/medecin", protectMedecin, getMedecinAppointments);
router.get("/:id", protect, getAppointmentById);
router.put("/:id/status", protectMedecin, updateAppointmentStatus);
router.get("/medecin/accepted", protectMedecin, getAcceptedAppointments);

router.delete("/medecin/:id", protectMedecin, deleteAppointmentByDoctor);



export default router;
