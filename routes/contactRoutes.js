// routes/contact.js

import express from "express";
import { handleContactForm } from "../controllers/contact.js"; // ajuste le chemin si besoin

const router = express.Router();

router.post("/", handleContactForm); // POST /api/contact

export default router;
