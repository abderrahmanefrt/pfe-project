import asyncHandler from "express-async-handler";
import Availability from "../models/Availability.js";
import { Op } from "sequelize";

export const addDisponibilite = asyncHandler(async (req, res) => {
  const { jour, heureDebut, heureFin } = req.body;
  const medecinId = req.user.id; // ID from token

  if (!jour || !heureDebut || !heureFin) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  // Validation du format de l'heure (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(heureDebut) || !timeRegex.test(heureFin)) {
    return res.status(400).json({ message: "Le format de l'heure doit être HH:MM" });
  }

  // Vérifier que l'heure de début est bien avant l'heure de fin
  if (heureDebut >= heureFin) {
    return res.status(400).json({ message: "L'heure de début doit être avant l'heure de fin." });
  }

  // Vérifier qu'il n'y a pas de chevauchement de créneaux
  const overlap = await Availability.findOne({
    where: {
      medecinId,
      jour,
      [Op.or]: [
        { heureDebut: { [Op.between]: [heureDebut, heureFin] } },
        { heureFin: { [Op.between]: [heureDebut, heureFin] } }
      ]
    }
  });

  if (overlap) {
    return res.status(400).json({ message: "Un créneau existe déjà dans cette plage horaire." });
  }

  const disponibilite = await Availability.create({ medecinId, jour, heureDebut, heureFin });

  res.status(201).json({ message: "Disponibilité ajoutée avec succès.", disponibilite });
});

export const getDisponibilites = asyncHandler(async (req, res) => {
  const disponibilites = await Availability.findAll({ where: { medecinId: req.user.id } });
  res.status(200).json(disponibilites);
});

export const updateDisponibilite = asyncHandler(async (req, res) => {
  const { jour, heureDebut, heureFin } = req.body;
  const disponibilite = await Availability.findByPk(req.params.id);

  if (!disponibilite || disponibilite.medecinId !== req.user.id) {
    return res.status(404).json({ message: "Disponibilité non trouvée." });
  }

  disponibilite.jour = jour || disponibilite.jour;
  disponibilite.heureDebut = heureDebut || disponibilite.heureDebut;
  disponibilite.heureFin = heureFin || disponibilite.heureFin;

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
