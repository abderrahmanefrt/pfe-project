import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Medecin from "./Medecin.js"; 

const Availability = sequelize.define("Availability", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  
  medecinId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Medecin,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  jour: {
    type: DataTypes.ENUM("Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"),
    allowNull: false,
  },
  heureDebut: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  heureFin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
});



export default Availability;

