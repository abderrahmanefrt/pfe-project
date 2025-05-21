import express from "express";
import { getDisponibilitesByMedecin,updateDisponibilite,searchMedecinsByDisponibilite } from "../controllers/availabilityController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:medecinId", getDisponibilitesByMedecin);
router.get("/medecins/by-availability", searchMedecinsByDisponibilite);




export default router;
