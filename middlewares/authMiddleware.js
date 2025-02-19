import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import asyncHandler from "express-async-handler";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";

dotenv.config();

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Non autorisé, aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

  
    if (decoded.role === "admin") {
      req.user = { role: "admin" };
      return next();
    }

  
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    res.status(401).json({ message: "Non autorisé, token invalide." });
  }
});

export const protectMedecin = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Non autorisé, aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    const medecin = await Medecin.findByPk(decoded.id);
    if (!medecin) {
      return res.status(401).json({ message: "Médecin non trouvé." });
    }

    req.user = medecin;
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    res.status(401).json({ message: "Non autorisé, token invalide." });
  }
});

//  Middleware pour protéger les routes des administrateurs uniquement
export const admin = (req, res, next) => {
  console.log("Middleware admin - req.user:", req.user);

  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé. Admin requis." });
  }
};
