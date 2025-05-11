import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import Medecin from "../models/Medecin.js";
import { Op } from "sequelize";
import {  Sequelize } from "sequelize";




export const getMedc = asyncHandler(async (req, res) => {

  const medecin = await Medecin.findByPk(req.user.id,
    {attributes: { exclude: ["password"] }});
  if (!medecin) {
    res.status(404);
    throw new Error("Médecin non trouvé");
  }
  res.status(200).json(medecin);
});

//update profile medecin
/**
 * @desc Modifier le profil du médecin
 * @route PUT /api/medecins/profile
 * @access Médecin (authentifié)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const medecin = await Medecin.findByPk(req.user.id);
  
  if (!medecin) {
    res.status(404);
    throw new Error("Médecin non trouvé");
  }


  const { firstname, lastname, email, phone, specialite, dateOfBirth, licenseNumber } = req.body;


  medecin.firstname = firstname || medecin.firstname;
  medecin.lastname = lastname || medecin.lastname;
  medecin.email = email || medecin.email;
  medecin.phone = phone || medecin.phone;
  medecin.specialite = specialite || medecin.specialite;
  medecin.dateOfBirth = dateOfBirth || medecin.dateOfBirth; 
  medecin.licenseNumber = licenseNumber || medecin.licenseNumber; 
   


  
  await medecin.save();

  
  res.status(200).json({ message: "Profil mis à jour avec succès", medecin });
});
/**
 * @desc Changer le mot de passe
 * @route PUT /api/medecins/password
 * @access Médecin (authentifié)
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const medecin = await Medecin.findByPk(req.user.id);

  if (!medecin) {
    res.status(404);
    throw new Error("Médecin non trouvé");
  }

  const isMatch = await bcrypt.compare(oldPassword, medecin.password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Ancien mot de passe incorrect");
  }

  medecin.password = await bcrypt.hash(newPassword, 10);
  await medecin.save();

  res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
});


export const deleteMyAccount = asyncHandler(async (req, res) => {
  const medecin = await Medecin.findByPk(req.user.id);

  if (!medecin) {
    return res.status(404).json({ message: "Compte non trouvé." });
  }

  await medecin.destroy();
  
  res.status(200).json({ message: "Compte supprimé avec succès." });
});


export const searchMedecins = asyncHandler(async (req, res) => {
  const { firstname, specialite, date, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  const whereClause = {
    status: "approved",
  };

  if (firstname) {
    whereClause.firstname = { [Op.iLike]: `%${firstname}%` };
  }

  if (specialite) {
    whereClause.specialite = { [Op.iLike]: `%${specialite}%` };
  }

  let includeAvailability = {};
  if (date) {
    includeAvailability = {
      model: Availability,
      where: {
        date: date,
      },
      required: true, // Fait un INNER JOIN pour ne retourner que les médecins avec disponibilité
    };
  }

  const { count, rows } = await Medecin.findAndCountAll({
    where: whereClause,
    include: date ? [includeAvailability] : [],
    offset: parseInt(offset),
    limit: parseInt(limit),
    attributes: { exclude: ["password", "createdAt", "updatedAt", "document"] },
    distinct: true, // Important pour le count correct avec les includes
  });

  res.status(200).json({
    total: count,
    currentPage: parseInt(page),
    totalPages: Math.ceil(count / limit),
    medecins: rows,
  });
});



export const getMedecinsProches = asyncHandler(async (req, res) => {
  const { latitude, longitude, distance = 10 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude et longitude requises" });
  }

  const distanceInKm = parseFloat(distance);

  const earthRadius = 6371; // rayon de la terre en km

  const medecins = await Medecin.findAll({
    attributes: {
      include: [
        [
          Sequelize.literal(`
            ${earthRadius} * acos(
              cos(radians(${latitude})) *
              cos(radians(latitude)) *
              cos(radians(longitude) - radians(${longitude})) +
              sin(radians(${latitude})) *
              sin(radians(latitude))
            )
          `),
          'distance'
        ]
      ],
    },
    where: {
      latitude: { [Op.ne]: null },
      longitude: { [Op.ne]: null },
    },
    order: Sequelize.literal('distance ASC'),
  });

  const medecinsProches = medecins.filter(m => m.dataValues.distance <= distanceInKm);

  res.json(medecinsProches);
});

