import cron from "node-cron";
import { sendEmailrap } from "./email.js";
import Appointment from "../models/Appointment.js";
import User from "../models/Users.js";
import { Op } from "sequelize";
import moment from "moment";

cron.schedule("0 11 * * *", async () => {
  try {
    console.log("🕒 Vérification des rendez-vous dans 24h...");

    // Obtenir la date de demain au format YYYY-MM-DD
    const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");
    console.log("Date recherchée:", tomorrow);

    // D'abord, afficher tous les rendez-vous pour vérifier
    const allAppointments = await Appointment.findAll({
      where: {
        status: "accepter"
      },
      include: [{ model: User, attributes: ["email", "firstname", "lastname"] }],
    });

    console.log("Tous les rendez-vous acceptés:", allAppointments.map(apt => ({
      date: apt.date,
      time: apt.time,
      status: apt.status
    })));

    // Ensuite, chercher les rendez-vous pour demain
    const appointments = await Appointment.findAll({
      where: {
        date: tomorrow,
        status: "accepter"
      },
      include: [{ model: User, attributes: ["email", "firstname", "lastname"] }],
    });

    console.log(`Nombre de rendez-vous trouvés pour demain: ${appointments.length}`);

    if (appointments.length === 0) {
      console.log("✅ Aucun rendez-vous à rappeler.");
      return;
    }

    const sentEmails = new Set();

    for (const appointment of appointments) {
      const { email, firstname } = appointment.User;
      console.log(`Traitement du rendez-vous pour ${firstname} (${email}) le ${appointment.date} à ${appointment.time}`);

      if (!sentEmails.has(email)) {
        const subject = "📅 Reminder for your medical appointment";
        const message = `
Hello ${firstname},  

✨ This is a reminder to inform you that you have a medical appointment scheduled for tomorrow.  

📍 Please make sure to be on time.  
🕒 If you have any questions or wish to cancel, feel free to contact us.  

Best regards,  
The medical team.`;

        await sendEmailrap(email, subject, message);
        console.log(`📩 Email envoyé à ${email} pour un rendez-vous le ${appointment.date} à ${appointment.time}`);
        
        sentEmails.add(email);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des rappels :", error);
    console.error("Détails de l'erreur:", error.stack);
  }
});

