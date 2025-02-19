import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Medecin = sequelize.define(
  "Medecin",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    specialite: {
      type: DataTypes.STRING(100),
    },
    document: {
      type: DataTypes.STRING(255),
      allowNull: false, 
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: "pending",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Medecins",
    timestamps: false, 
  }
);

export default Medecin;
