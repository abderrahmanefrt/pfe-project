import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    res.status(400).json({ message: "Tous les champs sont requis" });
    return;
  }

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    res.status(400).json({ message: "L'utilisateur existe déjà" });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ 
    name, 
    email, 
    phone, 
    password: hashedPassword  
  });

  res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(401).json({ message: "Email ou mot de passe incorrect" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401).json({ message: "Email ou mot de passe incorrect" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email ,role: user.role,},
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );


  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    token,
  });
});


//Medecin

//register medecin
export const registerMedecin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, specialite } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Le document PDF est obligatoire" });
  }

  const existingMedecin = await Medecin.findOne({ where: { email } });
  if (existingMedecin) {
    return res.status(400).json({ message: "Le médecin existe déjà" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newMedecin = await Medecin.create({
    name,
    email,
    phone,
    password: hashedPassword,
    specialite,
    document: req.file.path,
  });

  res.status(201).json({ message: "Médecin créé avec succès", medecin: newMedecin });
});


//login medecin
export const loginMedecin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const medecin = await Medecin.findOne({ where: { email } });

  if (medecin && (await bcrypt.compare(password, medecin.password))) {
    
    const token = jwt.sign(
      { id: medecin.id, email: medecin.email, role: "medecin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      id: medecin.id,
      name: medecin.name,
      email: medecin.email,
      specialite: medecin.specialite,
      token,
    });
  } else {
    res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }
});



