import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";





export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] }, 
  });

  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  res.status(200).json(user);
});

//update profile user
/**
 * @desc Modifier le profil du médecin
 * @route PUT /api/users/profile
 * @access user (authentifié)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  if (!user) {
    res.status(404);
    throw new Error("User non trouvé");
  }

  
  const { firstname, lastname, email, phone, dateOfBirth } = req.body;

  
  user.firstname = firstname || user.firstname;
user.lastname = lastname || user.lastname;
user.email = email || user.email;
user.phone = phone || user.phone;
user.dateOfBirth = dateOfBirth || user.dateOfBirth;


  
  await user.save();

  
  res.status(200).json({ message: "Profil mis à jour avec succès", user });
});

/**
 * @desc Changer le mot de passe
 * @route PUT /api/users/password
 * @access users (authentifié)
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("user non trouvé");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Ancien mot de passe incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "Compte non trouvé." });
  }

  await user.destroy();
  
  res.status(200).json({ message: "Compte supprimé avec succès." });
});


export const getMedicins =asyncHandler(async (req,res)=>{
  const medecins = await Medecin.findAll({
    where: {status :"approved"},
    attributes: { exclude: ["password", "createdAt", "updatedAt", "document","created_at","updated_at"] },
  });

  res.status(200).json(medecins);
});
 




