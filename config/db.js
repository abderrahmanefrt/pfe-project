import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Forcer le mode production pour Render
const isProduction = true;
console.log("Mode:", isProduction ? "Production" : "Development");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas configurée dans les variables d'environnement");
  process.exit(1);
}

console.log("URL de la base de données:", process.env.DATABASE_URL ? "Configurée" : "Non configurée");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
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
    console.log("✅ Connexion à la base de données réussie");
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à la base de données:", err.message);
    console.error("Détails de l'erreur:", err);
    process.exit(1);
  });

export default sequelize;
