import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import Medecin from "../models/Medecin.js";
import { Op } from "sequelize";
import {  Sequelize } from "sequelize";
import Avis from "../models/Avis.js";
import Availability from "../models/Availability.js";
import { fn, col, literal } from "sequelize";




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

  const {
    firstname,
    lastname,
    email,
    phone,
    specialite,
    dateOfBirth,
    licenseNumber,
    biography, // <-- ajouté ici
  } = req.body;

  medecin.firstname = firstname || medecin.firstname;
  medecin.lastname = lastname || medecin.lastname;
  medecin.email = email || medecin.email;
  medecin.phone = phone || medecin.phone;
  medecin.specialite = specialite || medecin.specialite;
  medecin.dateOfBirth = dateOfBirth || medecin.dateOfBirth;
  medecin.licenseNumber = licenseNumber || medecin.licenseNumber;
  medecin.biography = biography || medecin.biography; // <-- ajout de la mise à jour de biography

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
  const { firstname, specialite, page = 1, limit = 10, rating, date } = req.query;

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

  let availabilityClause = {};
  if (date) {
    availabilityClause.date = date;
  }

  const count = await Medecin.count({
    where: whereClause,
    include: [
      {
        model: Availability,
        as: "availabilities",
        where: Object.keys(availabilityClause).length > 0 ? availabilityClause : undefined,
        required: !!date,
      },
      {
        model: Avis,
        as: "avis",
        where: { status: "approved" },
        required: false,
      },
    ],
    distinct: true,
    col: "id",
  });

  // Étape 2 : récupérer les médecins avec détails
  const medecins = await Medecin.findAll({
    where: whereClause,
    offset: parseInt(offset),
    limit: parseInt(limit),
    attributes: {
      exclude: ["password", "createdAt", "updatedAt", "document"],
      include: [[fn("AVG", literal('"avis"."note"')), "averageRating"]],
    },
    include: [
      {
        model: Avis,
        as: "avis",
        attributes: [], // on n’a pas besoin d’afficher chaque note
        where: { status: "approved" },
        required: false,
      },
      {
        model: Availability,
        as: "availabilities",
        attributes: ["date", "startTime", "endTime"],
        where: Object.keys(availabilityClause).length > 0 ? availabilityClause : undefined,
        required: !!date,
      },
    ],
    group: ["Medecin.id", "availabilities.id"],
    having: rating ? literal(`AVG("avis"."note") >= ${parseFloat(rating)}`) : undefined,
    subQuery: false,
  });

  res.status(200).json({
    total: count,
    currentPage: parseInt(page),
    totalPages: Math.ceil(count / limit),
    medecins,
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

