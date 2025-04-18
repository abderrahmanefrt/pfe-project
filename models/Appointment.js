import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Medecin from "./Medecin.js";
import User from "./Users.js";

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  medecinId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '00:00:00',
  },
  
  numeroPassage: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  }
});

Appointment.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Appointment.belongsTo(Medecin, { foreignKey: "medecinId", onDelete: "CASCADE" });

export default Appointment;
