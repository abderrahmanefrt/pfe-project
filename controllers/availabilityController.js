import asyncHandler from "express-async-handler";
import Availability from "../models/Availability.js";
import { Op } from "sequelize";
import Appointment from "../models/Appointment.js";


export const addDisponibilite = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, maxPatient } = req.body;
  const medecinId = req.user.id;

  // Vérification des champs requis
  if (!date || !startTime || !endTime || !maxPatient) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }
  

  // Validation du format de l'heure
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({ message: "Le format de l'heure doit être HH:MM" });
  }

  // Vérifie que l'heure de début est avant l'heure de fin
  if (startTime >= endTime) {
    return res.status(400).json({ message: "L'heure de début doit être avant l'heure de fin." });
  }

  // Vérifie que maxPatient est un entier positif
  const parsedMax = parseInt(maxPatient, 10);
  if (isNaN(parsedMax) || parsedMax <= 0) {
    return res.status(400).json({ message: "Le nombre maximum de patients doit être un entier positif." });
  }

  // Vérifie les chevauchements
  const overlap = await Availability.findOne({
    where: {
      medecinId,
      date,
      [Op.or]: [
        {
          startTime: {
            [Op.lt]: endTime
          },
          endTime: {
            [Op.gt]: startTime
          }
        }
      ]
    }
  });

  if (overlap) {
    return res.status(400).json({ message: "Un créneau existe déjà dans cette plage horaire." });
  }

  // Création de la disponibilité
  const disponibilite = await Availability.create({
    medecinId,
    date,
    startTime,
    endTime,
    maxPatient: parsedMax
  });

  res.status(201).json({
    message: "Disponibilité ajoutée avec succès.",
    disponibilite
  });
});



export const getDisponibilites = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const disponibilitesAVenir = await Availability.findAll({
    where: {
      medecinId: req.user.id,
      date: {
        [Op.gte]: today
      }
    },
    order: [["date", "ASC"], ["startTime", "ASC"]],
  });

  const disponibilitesPassees = await Availability.findAll({
    where: {
      medecinId: req.user.id,
      date: {
        [Op.lt]: today
      }
    },
    order: [["date", "DESC"], ["startTime", "ASC"]],
  });

  res.status(200).json({
    a_venir: disponibilitesAVenir,
    passees: disponibilitesPassees,
  });
});


export const updateDisponibilite = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, maxPatient } = req.body;
  const disponibilite = await Availability.findByPk(req.params.id);

  if (!disponibilite || disponibilite.medecinId !== req.user.id) {
    return res.status(404).json({ message: "Disponibilité non trouvée." });
  }

  // Vérification des heures si présentes
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if ((startTime && !timeRegex.test(startTime)) || (endTime && !timeRegex.test(endTime))) {
    return res.status(400).json({ message: "Le format de l'heure doit être HH:MM" });
  }

  const newStartTime = startTime || disponibilite.startTime;
  const newEndTime = endTime || disponibilite.endTime;
  const newDate = date || disponibilite.date;

  if (newStartTime >= newEndTime) {
    return res.status(400).json({ message: "L'heure de début doit être avant l'heure de fin." });
  }

  // Vérifie qu'il n'y a pas de conflit avec d'autres créneaux
  const overlap = await Availability.findOne({
    where: {
      medecinId: req.user.id,
      id: { [Op.ne]: disponibilite.id }, // exclure la dispo en cours de modification
      date: newDate,
      [Op.or]: [
        {
          startTime: { [Op.lt]: newEndTime },
          endTime: { [Op.gt]: newStartTime },
        },
      ],
    },
  });

  if (overlap) {
    return res.status(400).json({ message: "Ce créneau chevauche un autre déjà existant." });
  }

  // Mise à jour
  disponibilite.date = newDate;
  disponibilite.startTime = newStartTime;
  disponibilite.endTime = newEndTime;

  if (maxPatient !== undefined) {
    const parsedMax = parseInt(maxPatient, 10);
    if (isNaN(parsedMax) || parsedMax <= 0) {
      return res.status(400).json({ message: "Le nombre maximum de patients doit être un entier positif." });
    }
    disponibilite.maxPatient = parsedMax;
  }

  await disponibilite.save();

  res.status(200).json({
    message: "Disponibilité mise à jour avec succès.",
    disponibilite,
  });
});


export const deleteDisponibilite = asyncHandler(async (req, res) => {
  try {
    console.log("Tentative de suppression de disponibilité");
    console.log("ID reçu:", req.params.id);
    console.log("User ID:", req.user.id);

    const disponibilite = await Availability.findByPk(req.params.id);

    if (!disponibilite) {
      console.log("Disponibilité non trouvée");
      return res.status(404).json({ message: "Disponibilité non trouvée." });
    }

    console.log("Disponibilité trouvée:", disponibilite.toJSON());

    if (disponibilite.medecinId !== req.user.id) {
      console.log("Accès refusé - ID médecin ne correspond pas");
      return res.status(403).json({ message: "Non autorisé à supprimer cette disponibilité." });
    }

    // Supprimer d'abord les rendez-vous associés
    await Appointment.destroy({
      where: { availabilityId: disponibilite.id }
    });

    // Ensuite supprimer la disponibilité
    await disponibilite.destroy();
    console.log("Disponibilité supprimée avec succès");
    res.status(200).json({ message: "Disponibilité et rendez-vous associés supprimés avec succès." });

  } catch (error) {
    console.error("Erreur détaillée lors de la suppression:", error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la suppression", 
      error: error.message,
      stack: error.stack 
    });
  }
});




export const getDisponibilitesByMedecin = asyncHandler(async (req, res) => {
  const { medecinId } = req.params;

  if (!medecinId || isNaN(medecinId)) {
    return res.status(400).json({
      message: "L'ID du médecin est requis et doit être un nombre."
    });
  }

  const today = new Date().toISOString().split("T")[0];

  const disponibilitesAVenir = await Availability.findAll({
    where: {
      medecinId,
      date: {
        [Op.gte]: today
      }
    },
    order: [["date", "ASC"], ["startTime", "ASC"]],
  });

  const disponibilitesPassees = await Availability.findAll({
    where: {
      medecinId,
      date: {
        [Op.lt]: today
      }
    },
    order: [["date", "DESC"], ["startTime", "ASC"]],
  });

  res.status(200).json({
    a_venir: disponibilitesAVenir,
  
  });
});


export const searchMedecinsByDisponibilite = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  // Trouver tous les médecins qui ont des disponibilités à cette date
  const disponibilites = await Availability.findAll({
    where: { date },
    include: [{
      model: Medecin,
      as: 'medecin',
      attributes: ['id', 'firstname', 'lastname', 'specialite', 'address', 'photo']
    }],
    order: [["startTime", "ASC"]],
  });

  // Grouper par médecin et formater la réponse
  const medecinsMap = new Map();
  disponibilites.forEach(dispo => {
    if (!medecinsMap.has(dispo.medecin.id)) {
      medecinsMap.set(dispo.medecin.id, {
        ...dispo.medecin.dataValues,
        availabilities: []
      });
    }
    medecinsMap.get(dispo.medecin.id).availabilities.push({
      date: dispo.date,
      startTime: dispo.startTime,
      endTime: dispo.endTime
    });
  });

  const medecins = Array.from(medecinsMap.values());

  res.status(200).json(medecins);
});


