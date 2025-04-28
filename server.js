import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/userRoutes.js";
import medRoutes from "./routes/medRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import avisRoutes from "./routes/avisRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";
import upload from "./middlewares/uploads.js";

import sequelize from "./config/db.js";
import "./utils/cronJobs.js";
import "./models/relations.js";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

// 🛠 Mettre CORS correctement
app.use(cors({
  origin: 'http://localhost:5173', // ou l'URL de ton frontend
  credentials: true
}));

// 🛠 Mettre express.json() + cookieParser AVANT les routes
app.use(express.json());
app.use(cookieParser());

// 🛠 Routes simples
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API de prise de rendez-vous 🚀');
});
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API OK' });
});
app.get("/api/auth/test", (req, res) => {
  res.json({ message: "Auth route OK" });
});

// 🛠 Routes principales
app.use("/api/users", userRoutes);
app.use("/api/medecin", medRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/disponibilites", availabilityRoutes);
app.use("/api/avis", avisRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));

// 🛠 Middleware erreurs
app.use(errorHandler);

// Connexion à la base
try {
  await sequelize.authenticate();
  console.log('✅ Connexion à la base réussie.');
} catch (error) {
  console.error('❌ Connexion échouée :', error);
}

// Synchronisation
sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Modèles synchronisés.");
  })
  .catch((err) => {
    console.error("❌ Erreur de synchronisation :", err);
  });

// Démarrage serveur
app.listen(port, () => {
  console.log(`🚀 Serveur en écoute sur le port ${port}`);
});
