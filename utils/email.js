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

export const sendEmail = async (to, subject="inscription sur la platforme", name="patient") => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to, 
      subject: subject,
      text: `Bonjour ${name},\n\nBienvenue sur notre plateforme de gestion des rendez-vous médicaux ! Nous sommes ravis de vous compter parmi nous.\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nCordialement,\nL'équipe de support`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.response);
  } catch (error) {
    console.error("❌ Erreur d'envoi d'email :", error);
  }
};
