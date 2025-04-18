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
  date: {
    type: DataTypes.STRING, 
    allowNull: false,
  },
  maxPatient:{
    type:DataTypes.INTEGER,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
});

export default Availability;
