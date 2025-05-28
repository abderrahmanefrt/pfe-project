import cron from "node-cron";
import { sendEmailrap } from "./email.js";
import Appointment from "../models/Appointment.js";
import User from "../models/Users.js";
import { Op } from "sequelize";
import moment from "moment";
import 'moment-timezone';

// Configuration du fuseau horaire
moment.tz.setDefault('Africa/Algiers'); // Fuseau horaire de l'Algérie

cron.schedule("* * * * *", async () => {
  try {
    const currentTime = moment().tz('Africa/Algiers');
    console.log("🕒 Vérification des rendez-vous...");
    console.log("⏰ Heure actuelle (Algérie):", currentTime.format('YYYY-MM-DD HH:mm:ss'));

    // Obtenir la date de demain au format YYYY-MM-DD
    const tomorrow = moment().tz('Africa/Algiers').add(1, "days").format("YYYY-MM-DD");
    console.log("📅 Date recherchée:", tomorrow);

    // Chercher les rendez-vous pour demain
    const appointments = await Appointment.findAll({
      where: {
        date: tomorrow,
        status: "accepter"
      },
      include: [{ model: User, attributes: ["email", "firstname", "lastname"] }],
    });

    console.log(`📊 Statistiques:
    - Nombre de rendez-vous trouvés: ${appointments.length}
    - Date de vérification: ${tomorrow}
    - Heure de vérification (Algérie): ${currentTime.format('HH:mm:ss')}`);

    if (appointments.length === 0) {
      console.log("✅ Aucun rendez-vous à rappeler.");
      return;
    }

    const sentEmails = new Set();

    for (const appointment of appointments) {
      const { email, firstname } = appointment.User;
      console.log(`📝 Traitement du rendez-vous:
        - Patient: ${firstname}
        - Email: ${email}
        - Date: ${appointment.date}
        - Heure: ${appointment.time}
        - Heure locale (Algérie): ${currentTime.format('HH:mm:ss')}`);

      if (!sentEmails.has(email)) {
        const subject = "📅 Rappel de votre rendez-vous médical";
        const message = `
Bonjour ${firstname},  

✨ Ceci est un rappel pour vous informer que vous avez un rendez-vous médical prévu pour demain.  

📍 N'oubliez pas d'être à l'heure.  
🕒 Si vous avez des questions ou souhaitez annuler, n'hésitez pas à nous contacter.  

Cordialement,  
L'équipe médicale.`;

        await sendEmailrap(email, subject, message);
        console.log(`📩 Email envoyé à ${email} pour un rendez-vous le ${appointment.date} à ${appointment.time}`);
        sentEmails.add(email);
      }
    }

    console.log(`✅ Traitement terminé à ${currentTime.format('HH:mm:ss')}`);

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des rappels :", error);
    console.error("Détails de l'erreur:", error.stack);
  }
}, {
  scheduled: true,
  timezone: "Africa/Algiers" // Spécifier explicitement le fuseau horaire de l'Algérie
});

console.log("✅ Cron job configuré pour s'exécuter à 12:30 (heure algérienne)");

