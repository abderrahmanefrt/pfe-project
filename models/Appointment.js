import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Medecin from "./Medecin.js";
import User from "./Users.js";

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,  // Remplacer Sequelize.UUID par DataTypes.UUID
    defaultValue: DataTypes.UUIDV4,  // Génère un UUID par défaut
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,  // Utilisation de DataTypes au lieu de Sequelize
    allowNull: false,
  },
  medecinId: {
    type: DataTypes.INTEGER,  // Utilisation de DataTypes au lieu de Sequelize
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,  // Utilisation de DataTypes au lieu de Sequelize
    allowNull: false,
  },
  numeroPassage: {
    type: DataTypes.INTEGER,  // Utilisation de DataTypes au lieu de Sequelize
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,  // Utilisation de DataTypes au lieu de Sequelize
    defaultValue: 'pending',
  }
});

Appointment.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Appointment.belongsTo(Medecin, { foreignKey: "medecinId", onDelete: "CASCADE" });

export default Appointment;
