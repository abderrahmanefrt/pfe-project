import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import sequelize from "./config/db.js";
import medRoutes from "./routes/medRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import avisRoutes from "./routes/avisRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import upload from "./middlewares/uploads.js";
import "./utils/cronJobs.js";
import cors  from "cors";
import cookieParser from "cookie-parser";
import "./models/relations.js";

dotenv.config(); 

const app = express();
const port = process.env.PORT || 3000;
//for front end
app.use(cors());

app.use(express.json());


app.use("/api/users", userRoutes);
app.use("/api/medecin", medRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/disponibilites", availabilityRoutes);
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());

app.use("/api/avis", avisRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes);
app.use(errorHandler);

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

sequelize.sync({ alter: true }) 
  .then(() => {
    console.log("✅ Base de données synchronisée !");
  })
  .catch((err) => {
    console.error("❌ Erreur de synchronisation :", err);
  });


app.listen(port, () => {
  console.log(` Serveur en écoute sur le port ${port}`);
});
