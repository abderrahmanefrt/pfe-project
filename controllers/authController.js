import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";
import { sendEmail } from "../utils/email.js"
import { getCoordinatesFromAddress } from "../utils/geolocate.js";
import fetch from 'node-fetch';


const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const registerUser = asyncHandler(async (req, res) => {
  const { firstname,lastname, email, phone, password, gender, dateOfBirth ,address} = req.body;

  if (!firstname || !lastname|| !email || !phone || !password || !gender || !dateOfBirth || !address) {
    res.status(400).json({ message: "Tous les champs sont requis" });
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
  });

  await sendEmail(email, firstname);

  res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
});



export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // true en production (HTTPS)
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  });

  res.json({
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    accessToken,
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
  } = req.body;

  if (!firstname || !lastname || !email || !phone || !password || !specialite || !dateOfBirth || !licenseNumber || !address) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires" });
  }

  if (!req.files || !req.files["document"]) {
    return res.status(400).json({ message: "Le document PDF est obligatoire" });
  }

  if (!req.files["photo"]) {
    return res.status(400).json({ message: "La photo est obligatoire" });
  }

  const existingMedecin = await Medecin.findOne({ where: { email } });
  if (existingMedecin) {
    return res.status(400).json({ message: "Le médecin existe déjà" });
  }

  
  const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const geoData = await geoRes.json();

  if (!geoData.length) {
    return res.status(400).json({ message: "Adresse invalide ou non localisée." });
  }

  const latitude = geoData[0].lat;
  const longitude = geoData[0].lon;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newMedecin = await Medecin.create({
    firstname,
    lastname,
    email,
    phone,
    password: hashedPassword,
    specialite,
    dateOfBirth,
    licenseNumber,
    address,
    latitude,
    longitude,
    document: req.files["document"][0].path,
    photo: req.files["photo"][0].path,
  });

  res.status(201).json({ message: "Médecin créé avec succès", medecin: newMedecin });
});


//login medecin
export const loginMedecin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const medecin = await Medecin.findOne({ where: { email } });

  if (!medecin || !(await bcrypt.compare(password, medecin.password))) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }

  // ❌ Vérifie si le compte est validé
  if (medecin.status !== "approved") {
    return res.status(403).json({ message: "Votre compte est en attente de validation par un administrateur." });
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

  res.json({
    id: medecin.id,
    firstname: medecin.firstname,
    lastname: medecin.lastname,
    email: medecin.email,
    specialite: medecin.specialite,
    accessToken,
  });
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




