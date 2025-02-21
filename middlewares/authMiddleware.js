import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import asyncHandler from "express-async-handler";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";




export const protectMedecin = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("🔹 Token décodé:", decoded);

      // 🔥 Vérifier dans la table Medecins, et non Users
      const medecin = await Medecin.findByPk(decoded.id);

      if (!medecin) {
        return res.status(401).json({ message: "Médecin non trouvé." });
      }

      req.user = medecin; // Stocker le médecin dans req.user
      next();
    } catch (error) {
      console.error("🔴 Erreur de token:", error);
      res.status(401).json({ message: "Non autorisé, token invalide" });
    }
  } else {
    res.status(401).json({ message: "Non autorisé, pas de token" });
  }
});


// Middleware pour protéger toutes les routes authentifiées
export const protect = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Non autorisé, aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔹 Token décodé:", decoded);

    if (decoded.role === "admin") {
      req.user = { role: "admin" };
      return next();
    }

    if (decoded.role === "user") {
      const user = await User.findByPk(decoded.id);
      if (!user) {
        console.log("❌ Utilisateur introuvable en base de données avec ID:", decoded.id);
        return res.status(401).json({ message: "Utilisateur non trouvé." });
      }
      req.user = user; 
      return next();
    }

    res.status(403).json({ message: "Accès refusé." });
  } catch (error) {
    console.error("❌ Erreur de vérification du token:", error);
    res.status(401).json({ message: "Non autorisé, token invalide." });
  }
});




// Middleware pour protéger les routes admin uniquement
export const admin = (req, res, next) => {
  console.log("🔹 Vérification admin - req.user:", req.user);

  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé. Admin requis." });
  }
};

export const patientOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") {
    return next(); // Admin peut voir tous les rendez-vous
  }

  if (req.user.role === "user") {
    req.isPatient = true; // On marque l'utilisateur comme patient
    return next();
  }

  res.status(403).json({ message: "Accès refusé." });
});

