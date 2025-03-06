import cron from "node-cron";
import { sendEmailrap } from "./email.js";
import Appointment from "../models/Appointment.js"; 
import User from "../models/Users.js"; 
import moment from "moment";

cron.schedule("0 8 * * *", async () => {
  try {
    console.log("🕒 Vérification des rendez-vous dans 24h...");

    const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");

    const appointments = await Appointment.findAll({
      where: { date: tomorrow },
      include: [{ model: User, attributes: ["email", "name"] }], // Utilisation de User
    });

    if (appointments.length === 0) {
      console.log("✅ Aucun rendez-vous à rappeler.");
      return;
    }

    for (const appointment of appointments) {
      const { email, name } = appointment.User; // Utilisation de User

      const subject = "📅 Rappel de votre rendez-vous médical";
      const message = `Bonjour ${name},\n\nCeci est un rappel pour votre rendez-vous médical prévu demain (${appointment.date}).\nMerci d'arriver à l'heure !\n\nCordialement,\nL'équipe médicale`;

      await sendEmailrap(email, subject, message);
      console.log(`📩 Email envoyé à ${email} pour un rendez-vous le ${appointment.date}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des rappels :", error);
  }
});
