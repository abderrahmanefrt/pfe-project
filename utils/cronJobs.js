import cron from "node-cron";
import { sendEmailrap } from "./email.js";
import Appointment from "../models/Appointment.js";
import User from "../models/Users.js";
import { Op } from "sequelize";
import moment from "moment";

cron.schedule("* * * * *", async () => {
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
        const subject = "📅 Reminder for your medical appointment";
      const message = `
Hello ${firstname},  

✨ This is a reminder to inform you that you have a medical appointment scheduled for tomorrow.  

📍 Please make sure to be on time.  
🕒 If you have any questions or wish to cancel, feel free to contact us.  

Best regards,  
The medical team.`;

        await sendEmailrap(email, subject, message);
        console.log(`📩 Email envoyé à ${email} pour un rendez-vous le ${moment(appointment.date).format("DD/MM/YYYY à HH:mm")}`);
        
        sentEmails.add(email); // Marque cet email comme envoyé
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des rappels :", error);
  }
});

