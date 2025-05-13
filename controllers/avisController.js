import asyncHandler from "express-async-handler";
import Avis from "../models/Avis.js";
import Appointment from "../models/Appointment.js";
import Medecin from "../models/Medecin.js";
import User from "../models/Users.js";


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
    where: { userId: req.user.id, medecinId, status: "accepter" },
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
    include: { model: User, attributes: ["firstname"] }, // Récupérer le nom du patient
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



export const getAverageRating = async (req, res) => {
  const medecinId = req.params.id;

  try {
    const result = await Avis.findAll({
      where: { medecinId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
      ],
      raw: true,
    });

    const averageRating = result[0].averageRating
      ? parseFloat(result[0].averageRating).toFixed(1)
      : null;

    res.status(200).json({ averageRating });
  } catch (error) {
    console.error("Erreur lors du calcul de la note moyenne :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};