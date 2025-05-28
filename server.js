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
import contactRoutes from "./routes/contactRoutes.js";



import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';


import sequelize from "./config/db.js";
import "./utils/cronJobs.js";
import "./models/relations.js";

dotenv.config();

// Forcer le mode production sur Render
process.env.NODE_ENV = 'production';
console.log("Mode:", process.env.NODE_ENV);

const app = express();

const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const allowedOrigins = [
  'http://localhost:5173',
  'https://dainty-centaur-972ebd.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // autoriser les appels sans origine (comme les outils serveur à serveur)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API de prise de rendez-vous 🚀');
});
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API OK' });
});
app.get("/api/auth/test", (req, res) => {
  res.json({ message: "Auth route OK" });
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 🛠 Routes principales
app.use("/api/users", userRoutes);
app.use("/api/medecin", medRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/disponibilites", availabilityRoutes);
app.use("/api/avis", avisRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/contact", contactRoutes);


// 🛠 Middleware erreurs
app.use(errorHandler);

// Connexion à la base
try {
  await sequelize.authenticate();
  console.log('✅ Connexion à la base réussie.');
  console.log('Base de données utilisée:', process.env.DATABASE_URL);
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
  console.log(`🚀 Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${port}`);
  console.log(`⏰ Cron job configuré pour s'exécuter tous les jours à 11h00`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Le port ${port} est déjà utilisé.`);
    process.exit(1);
  } else {
    throw err;
  }
});