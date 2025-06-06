import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./Users.js";
import Medecin from "./Medecin.js";


const Avis = sequelize.define("Avis", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
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
  note: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  commentaire: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
});

Avis.belongsTo(User, { foreignKey: "userId" });
Avis.belongsTo(Medecin, { foreignKey: "medecinId" });

export default Avis;
