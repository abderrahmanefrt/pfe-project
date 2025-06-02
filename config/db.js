import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Configuration pour le développement local
const isProduction = false;
console.log("Mode:", isProduction ? "Production" : "Development");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: (msg) => console.log("SQL:", msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3
  }
});

// Test de la connexion
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connexion à la base de données locale réussie");
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à la base de données:", err.message);
    console.error("Détails de l'erreur:", err);
    process.exit(1);
  });

export default sequelize;
