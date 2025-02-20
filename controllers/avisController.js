import asyncHandler from "express-async-handler";
import Avis from "../models/Avis.js";
import Appointment from "../models/Appointment.js";
import Medecin from "../models/Medecin.js";

/**
 * @desc Laisser un avis sur un médecin
 * @route POST /api/avis
 * @access Patient
 */
export const createAvis = asyncHandler(async (req, res) => {  
  const { medecinId, note, commentaire } = req.body; 
  const medecinExiste = await Medecin.findByPk(medecinId);

  if (!medecinExiste) {
    res.status(400);
    throw new Error("Médecin introuvable.");
  }
  if (!medecinId || !note || isNaN(note)) {
    res.status(400);
    throw new Error("Le médecin et la note sont obligatoires et la note doit être un nombre.");
  }
  

  const appointment = await Appointment.findOne({
    where: { userId: req.user.id, medecinId, status: "completed" },
  });

  if (!appointment) {
    res.status(403);
    throw new Error("Vous ne pouvez laisser un avis que si vous avez consulté ce médecin.");
  }
    // Vérifier si un avis existe déjà
    const existingAvis = await Avis.findOne({
      where: { userId: req.user.id, medecinId },
    });
  
    if (existingAvis) {
      res.status(400);
      throw new Error("Vous avez déjà laissé un avis pour ce médecin.");
    }

  const avis = await Avis.create({
    userId: req.user.id,
    medecinId,
    note, 
    commentaire, 
  });

  res.status(201).json({ message: "Avis ajouté avec succès", avis });
});

/**
 * @desc Récupérer tous les avis d'un médecin
 * @route GET /api/avis/:medecinId
 * @access Public
 */
export const getAvisByMedecin = asyncHandler(async (req, res) => {
  const avis = await Avis.findAll({
    where: { medecinId: req.params.medecinId },
    include: { model: User, attributes: ["name"] }, // Récupérer le nom du patient
  });

  res.status(200).json(avis);
});

/**
 * @desc Supprimer un avis
 * @route DELETE /api/avis/:id
 * @access Patient (auteur) ou Admin
 */
export const deleteAvis = asyncHandler(async (req, res) => {
  const avis = await Avis.findByPk(req.params.id);

  if (!avis) {
    res.status(404);
    throw new Error("Avis introuvable.");
  }

  if (req.user.id !== avis.userId && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Action non autorisée.");
  }

  await avis.destroy();
  res.status(200).json({ message: "Avis supprimé avec succès" });
});
