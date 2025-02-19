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
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,  
    },
  },
  commentaire: {
    type: DataTypes.TEXT,
  },
});

Avis.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Avis.belongsTo(Medecin, { foreignKey: "medecinId", onDelete: "CASCADE" });

export default Avis;
