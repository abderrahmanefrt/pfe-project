import asyncHandler from "express-async-handler";

import User from "../models/Users.js";



export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.status(200).json(users);
});


export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    res.status(404).json({ message: "Utilisateur non trouvé" });
  } else {
    res.status(200).json(user);
  }
});


export const createUser = asyncHandler(async (req, res) => {
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

  const newUser = await User.create({ name, email, phone, password });
  res.status(201).json(newUser);
});


export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    res.status(404).json({ message: "Utilisateur non trouvé" });
    return;
  }

  await user.update(req.body);
  res.status(200).json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    res.status(404).json({ message: "Utilisateur non trouvé" });
    return;
  }

  await user.destroy();
  res.status(200).json({ message: "Utilisateur supprimé" });
});
