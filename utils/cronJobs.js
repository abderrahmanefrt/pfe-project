import cron from "node-cron";
import { sendEmailrap } from "./email.js";
import Appointment from "../models/Appointment.js";
import User from "../models/Users.js";
import { Op } from "sequelize";
import moment from "moment";

cron.schedule("0 8 * * *", async () => {
  try {
    console.log("🕒 Vérification des rendez-vous dans 24h...");

    const startOfDay = moment().add(1, "days").startOf("day").utc().format();
    const endOfDay = moment().add(1, "days").endOf("day").utc().format();

    const appointments = await Appointment.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [{ model: User, attributes: ["email", "firstname","lastname"] }],
    });

    if (appointments.length === 0) {
      console.log("✅ Aucun rendez-vous à rappeler.");
      return;
    }

    const sentEmails = new Set();

    for (const appointment of appointments) {
      const { email, firstname } = appointment.User;

      if (!sentEmails.has(email)) { // Vérifie si l'email a déjà été envoyé
        const subject = "📅 Rappel de votre rendez-vous médical";
      const message = `
Bonjour ${firstname},  

✨ Ceci est un rappel pour vous informer que vous avez un rendez-vous médical prévu demain.  

📍 Merci de bien vouloir être à l'heure.  
🕒 Si vous avez des questions ou souhaitez annuler, n'hésitez pas à nous contacter.  

Cordialement,  
L'équipe médicale.`;

        await sendEmailrap(email, subject, message);
        console.log(`📩 Email envoyé à ${email} pour un rendez-vous le ${moment(appointment.date).format("DD/MM/YYYY à HH:mm")}`);
        
        sentEmails.add(email); // Marque cet email comme envoyé
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des rappels :", error);
  }
});

