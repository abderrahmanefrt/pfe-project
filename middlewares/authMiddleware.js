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

      const medecin = await Medecin.findByPk(decoded.id);

      if (!medecin) {
        return res.status(401).json({ message: "Médecin non trouvé." });
      }

      
      if (medecin.status !== "approved") {
        return res.status(403).json({ message: "Votre compte doit être validé par un administrateur." });
      }

      req.user = medecin;
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
// middleware/authMiddleware.js
export const admin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Accès réservé aux administrateurs" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

export const patientOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") {
    return next(); // Admin peut voir tous les rendez-vous
  }

  if (req.user.role === "user") {
    req.isPatient = true; 
    return next();
  }

  res.status(403).json({ message: "Accès refusé." });
});

