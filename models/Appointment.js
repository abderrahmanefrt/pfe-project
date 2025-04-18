import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Medecin from "./Medecin.js";
import User from "./Users.js";

const Appointment = sequelize.define("Appointment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  medecinId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Medecin,
      key: "id",
    },
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "cancelled","completed","accepter","refuser"),
    defaultValue: "pending",
  },
  numeroPassage: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  
  
});


Appointment.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Appointment.belongsTo(Medecin, { foreignKey: "medecinId", onDelete: "CASCADE" });

export default Appointment;
