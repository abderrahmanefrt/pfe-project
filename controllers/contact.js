// controllers/contactController.js

import { sendEmailrap } from "../utils/email.js"; // adapte le chemin si besoin

export const handleContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const subject = `Message de contact de ${name}`;
    const fullMessage = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    
    await sendEmailrap("indoctor8@gmail.com", subject, fullMessage);

    res.status(200).json({ success: true, message: "Message envoyé avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du message de contact :", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi du message" });
  }
};
