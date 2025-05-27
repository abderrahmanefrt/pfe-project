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
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
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
      allowNull: false, 
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY, 
      allowNull: false, 
    },
    licenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, 
    },
    document: {
      type: DataTypes.STRING(255),
      allowNull: false, 
    },
    photo: {
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
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true, 
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    
    
    
  },
  {
    tableName: "Medecins",
    timestamps: false,
  }
);


export default Medecin;