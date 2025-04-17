import express from "express";
import { getDisponibilitesByMedecin,updateDisponibilite } from "../controllers/availabilityController.js";

const router = express.Router();

router.get("/:medecinId", getDisponibilitesByMedecin);


export default router;
