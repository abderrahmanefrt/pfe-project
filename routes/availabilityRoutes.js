import express from "express";
import { getDisponibilitesByMedecin } from "../controllers/availabilityController.js";

const router = express.Router();

router.get("/:medecinId", getDisponibilitesByMedecin);

export default router;
