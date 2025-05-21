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

export const sendEmail = async (to, subject = "Registration on the platform", firstname = "patient") => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: subject,
      text: `Hello ${firstname},\n\nWelcome to our medical appointment management platform! We are happy to have you with us.\n\nIf you have any questions, feel free to contact us.\n\nBest regards,\nThe support team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
};

export const sendEmailapp = async (
  to,
  subject = "Appointment Request Submitted",
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
      text: `Hello ${firstname},\n\nYour appointment with Dr. ${doctorName} on ${date} at ${time} has been successfully requested.\n\n⏳ Please note: your appointment is currently pending and awaiting confirmation from the doctor. You will receive a notification once it is confirmed.\n\nIf you have any questions, feel free to contact us.\n\nBest regards,\nThe support team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
};

export const sendEmailmed = async (
  to,
  subject = "Notification",
  firstname = "User",
  message = "You have a new notification."
) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: subject,
      text: `Hello ${firstname},\n\n${message}\n\nBest regards,\nThe support team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email sending error:", error);
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
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
};

export const sendCancellationEmail = async (
  to,
  firstname,
  lastname,
  date,
  time,
  doctorName
) => {
  const text = `Dear ${firstname} ${lastname},

We regret to inform you that your medical appointment scheduled on ${date} at ${time} has been canceled by Dr. ${doctorName} due to unforeseen circumstances.

We sincerely apologize for the inconvenience caused.

Please feel free to reschedule at your convenience.

Best regards,
The support team`;

  await sendEmailrap(to, "Appointment Cancellation Notice", text);
};

