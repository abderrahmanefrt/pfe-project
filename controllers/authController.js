import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";
import { sendEmail  } from "../utils/email.js"
import { getCoordinatesFromAddress } from "../utils/geolocate.js";
import { sendOTPEmail } from "../utils/email.js";

import fetch from 'node-fetch';



const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Génère un code à 6 chiffres
}


export const registerUser = asyncHandler(async (req, res) => {
  const { firstname,lastname, email, phone, password, gender, dateOfBirth ,address} = req.body;

  if (!firstname || !lastname|| !email || !phone || !password || !gender || !dateOfBirth || !address) {
    res.status(400).json({ message: "Tous les champs sont requis" });
    return;
  }

  // Nouvelle validation pour le mot de passe
  if (password.length < 8) {
    res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    res.status(400).json({ message: "L'utilisateur existe déjà" });
    return;
  }
  const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const geoData = await geoRes.json();

  if (!geoData.length) {
    return res.status(400).json({ message: "Adresse invalide ou non localisée." });
  }

  const latitude = geoData[0].lat;
  const longitude = geoData[0].lon;


  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // expire dans 10 min


  const newUser = await User.create({ 
    firstname, 
    lastname,
    email, 
    phone, 
    password: hashedPassword,
    gender,  
    dateOfBirth: new Date(dateOfBirth), 
    address,
    latitude,
    longitude,
    otp,
  otpExpiresAt,
  isVerified: false,
  role: 'user',
  });
  await sendOTPEmail(email, firstname, otp);

  await sendEmail(email, firstname);
  res.status(201).json({
    message: "Utilisateur créé avec succès",
    user: {
      id: newUser.id,
      email: newUser.email,
      role: 'user', 
    }
  });
  
});







//Medecin

//register medecin
export const registerMedecin = asyncHandler(async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    phone,
    password,
    specialite,
    dateOfBirth,
    licenseNumber,
    address, 
    biography
  } = req.body;
  console.log("Fichiers reçus :", req.files);

  // Validation des champs requis
  if (!firstname || !lastname || !email || !phone || !password || !specialite || !dateOfBirth || !licenseNumber || !address) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires" });
  }

  // Nouvelle validation pour le mot de passe
  if (password.length < 8) {
    return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
  }

  // Validation des fichiers
  if (!req.files || !req.files["document"]) {
    return res.status(400).json({ message: "Le document PDF est obligatoire" });
  }

  if (!req.files["photo"]) {
    return res.status(400).json({ message: "La photo est obligatoire" });
  }

  // Vérification de l'existence d'un médecin avec le même email
  const existingMedecin = await Medecin.findOne({ where: { email } });
  if (existingMedecin) {
    return res.status(400).json({ message: "Le médecin existe déjà" });
  }

  // Géolocalisation de l'adresse
  const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const geoData = await geoRes.json();

  if (!geoData.length) {
    return res.status(400).json({ message: "Adresse invalide ou non localisée." });
  }

  const latitude = geoData[0].lat;
  const longitude = geoData[0].lon;

  // Hashage du mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  // Fonction pour nettoyer les guillemets parasites
  const clean = (val) => typeof val === "string" ? val.replace(/^"|"$/g, "") : val;

  // Préparation des données nettoyées
  const cleanedData = {
    firstname: clean(firstname),
    lastname: clean(lastname),
    email: clean(email),
    phone: clean(phone),
    password: hashedPassword,
    specialite: clean(specialite),
    dateOfBirth: clean(dateOfBirth),
    licenseNumber: clean(licenseNumber),
    address: clean(address),
    latitude,
    longitude,
    biography: clean(biography),
    document: req.files["document"][0].path,
    photo: req.files["photo"][0].path,
    otp,
  otpExpiresAt,
  isVerified: false,
  role: 'medecin',
  };


  // Création du médecin avec les données nettoyées
  const newMedecin = await Medecin.create(cleanedData);

  try {
    await sendOTPEmail(email, firstname, otp); // à condition que la fonction soit importée
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email OTP :", error);
  }
  

  res.status(201).json({
    message: "Médecin créé avec succès",
    medecin: {
      id: newMedecin.id,
      email: newMedecin.email,
      role: 'medecin', // 👈 Ajout dans la réponse
    }
  });
});


//login medecin
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Vérification pour l'admin
  if (email === process.env.ADMIN_EMAIL) {
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
  
    const payload = { role: "admin", id: "admin" }; 
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
  
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  
    return res.json({
      id: "admin", // ID cohérent
      role: "admin",
      accessToken,
      firstname: "Admin", // Champs requis par le frontend
      lastname: "System",
      email: process.env.ADMIN_EMAIL,
      phone: "", 
      specialite: "", 
      accessToken,
      refreshToken,
      message: "Connexion réussie",
    });
  }

  // Vérification pour le médecin
  const medecin = await Medecin.findOne({ where: { email } });
  if (medecin) {
    if (!(await bcrypt.compare(password, medecin.password))) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    if (medecin.status !== "approved") {
      return res.status(403).json({ message: "Votre compte est en attente de validation." });
    }

    const payload = { id: medecin.id, email: medecin.email, role: "medecin" };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      id: medecin.id,
      firstname: medecin.firstname,
      lastname: medecin.lastname,
      email: medecin.email,
      specialite: medecin.specialite,
      phone: medecin.phone,
      role: "medecin",
      accessToken,
      refreshToken,
      message: "Connexion réussie",
    });
  }

  // Vérification pour le patient
  const user = await User.findOne({ where: { email } });
  if (user) {
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accessToken,
      refreshToken,
      message: "Connexion réussie",
    });
  }

  return res.status(401).json({ message: "Email ou mot de passe incorrect" });
});








export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Pas de refresh token trouvé." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Refresh token invalide ou expiré." });
  }
});



export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, role } = req.body;

  // Log the incoming request body
  console.log("Verify OTP Request Body:", req.body);

  if (!email || !otp || !role) {
    console.log("Validation Failed: Email, OTP, or Role missing"); // Log validation failure
    return res.status(400).json({ message: "Email, OTP et rôle sont requis" });
  }

  const model = role === "medecin" ? Medecin : User;
  // Log which model is being used
  console.log("Using model:", role);

  const user = await model.findOne({ where: { email } });
  // Log the result of the user lookup
  console.log("User found:", user ? user.id : "None");

  if (!user) {
    console.log("Verification Failed: User not found for email", email); // Log user not found
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  if (user.isVerified) {
    console.log("Verification Failed: Account already verified for user", user.id); // Log already verified
    return res.status(400).json({ message: "Compte déjà vérifié" });
  }

  // Log the received OTP and stored OTP for comparison
  console.log(`Received OTP: ${otp}, Stored OTP: ${user.otp}`);
  if (user.otp !== otp) {
    console.log("Verification Failed: Incorrect OTP for user", user.id); // Log incorrect OTP
    return res.status(400).json({ message: "OTP incorrect" });
  }

  // Log the expiration date comparison
  console.log(`Current Time: ${new Date()}, OTP Expires At: ${user.otpExpiresAt}`);
  if (new Date() > user.otpExpiresAt) {
    console.log("Verification Failed: OTP expired for user", user.id); // Log expired OTP
    return res.status(400).json({ message: "OTP expiré" });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();
  // Log successful verification
  console.log("Account verified successfully for user", user.id);

  res.status(200).json({ message: "Compte vérifié avec succès" });
});




