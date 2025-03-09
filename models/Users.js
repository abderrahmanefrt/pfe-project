import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM("homme", "femme"),
    allowNull: false,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false, 
  },
  role: {
    type: DataTypes.ENUM("admin", "medecin", "user"),
    allowNull: false,
    defaultValue: "user",
  },
  status: {
    type: DataTypes.ENUM("active", "banned"),
    allowNull: false,
    defaultValue: "active", 
  },
}, { timestamps: true });

export default User;