import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Medecin from "./Medecin.js"; //

const Availability = sequelize.define("Availability", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
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
    type: DataTypes.TIME,
    allowNull: false,
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
});



export default Availability;

