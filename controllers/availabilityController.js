import asyncHandler from "express-async-handler";
import Availability from "../models/Availability.js";
import { Op } from "sequelize";

export const addDisponibilite = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.body;
  const medecinId = req.user.id; 

  if (!date || !startTime || !endTime) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({ message: "Le format de l'heure doit être HH:MM" });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ message: "L'heure de début doit être avant l'heure de fin." });
  }

  const overlap = await Availability.findOne({
    where: {
      medecinId,
      date,
      [Op.or]: [
        { startTime: { [Op.between]: [startTime, endTime] } },
        { endTime: { [Op.between]: [startTime, endTime] } }
      ]
    }
  });

  if (overlap) {
    return res.status(400).json({ message: "Un créneau existe déjà dans cette plage horaire." });
  }

  const disponibilite = await Availability.create({ medecinId, date, startTime, endTime });

  res.status(201).json({ message: "Disponibilité ajoutée avec succès.", disponibilite });
});

export const getDisponibilites = asyncHandler(async (req, res) => {
  const disponibilites = await Availability.findAll({ where: { medecinId: req.user.id } });
  res.status(200).json(disponibilites);
});

export const updateDisponibilite = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.body;
  const disponibilite = await Availability.findByPk(req.params.id);

  if (!disponibilite || disponibilite.medecinId !== req.user.id) {
    return res.status(404).json({ message: "Disponibilité non trouvée." });
  }

  disponibilite.date = date || disponibilite.date;
  disponibilite.startTime = startTime || disponibilite.startTime;
  disponibilite.endTime = endTime || disponibilite.endTime;

  await disponibilite.save();
  res.status(200).json({ message: "Disponibilité mise à jour avec succès.", disponibilite });
});

export const deleteDisponibilite = asyncHandler(async (req, res) => {
  const disponibilite = await Availability.findByPk(req.params.id);

  if (!disponibilite || disponibilite.medecinId !== req.user.id) {
    return res.status(404).json({ message: "Disponibilité non trouvée." });
  }

  await disponibilite.destroy();
  res.status(200).json({ message: "Disponibilité supprimée avec succès." });
});

export const getDisponibilitesByMedecin = asyncHandler(async (req, res) => {
  const { medecinId } = req.params;

  if (!medecinId) {
    return res.status(400).json({ message: "L'ID du médecin est requis." });
  }

  const disponibilites = await Availability.findAll({ 
    where: { medecinId }, 
    order: [["date", "ASC"], ["startTime", "ASC"]] 
  });

  if (!disponibilites.length) {
    return res.status(404).json({ message: "Aucune disponibilité trouvée pour ce médecin." });
  }

  res.status(200).json(disponibilites);
});
