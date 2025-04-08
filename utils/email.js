import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject="inscription sur la platforme", firstname="patient") => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to, 
      subject: subject,
      text: `Bonjour ${firstname},\n\nBienvenue sur notre plateforme de gestion des rendez-vous médicaux ! Nous sommes ravis de vous compter parmi nous.\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nCordialement,\nL'équipe de support`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.response);
  } catch (error) {
    console.error("❌ Erreur d'envoi d'email :", error);
  }
};
export const sendEmailapp = async (
  to,
  subject = "Confirmation de rendez-vous",
  firstname = "patient",
  date,
  time,
  doctorName
) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: subject,
      text: `Bonjour ${firstname},\n\nVotre rendez  avec le Dr. ${doctorName}  pour le ${date} à ${time}  est enregistrer  .\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nCordialement,\nL'équipe de support`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.response);
  } catch (error) {
    console.error("❌ Erreur d'envoi d'email :", error);
  }
};
export const sendEmailmed = async (
  to,
  subject = "Notification",
  firstname = "Utilisateur",
  message = "Vous avez une nouvelle notification."
) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: subject,
      text: `Bonjour ${firstname},\n\n${message}\n\nCordialement,\nL'équipe de support`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.response);
  } catch (error) {
    console.error("❌ Erreur d'envoi d'email :", error);
  }
};
export const sendEmailrap = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: subject,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.response);
  } catch (error) {
    console.error("❌ Erreur d'envoi d'email :", error);
  }
};