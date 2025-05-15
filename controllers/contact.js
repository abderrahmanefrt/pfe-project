import express from "express";
import { sendEmailrap } from "../utils/email.js"; // ajuste selon ton chemin
const router = express.Router();

router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const subject = `Message de contact de ${name}`;
    const fullMessage = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    
    await sendEmailrap("indoctor8@gmail.com", subject, fullMessage); // vers ton adresse pro

    res.status(200).json({ success: true, message: "Message envoyé avec succès" });
  } catch (error) {
    console.error("Erreur envoi contact :", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi du message" });
  }
});

export default router;
