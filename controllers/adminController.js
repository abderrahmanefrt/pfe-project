import asyncHandler from "express-async-handler";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";
import Appointment from "../models/Appointment.js";
import Avis from "../models/Avis.js";
import { sendEmailmed } from "../utils/email.js";
import { Sequelize } from "sequelize";

/** ============================ MÉDECINS ============================ **/
export const getAllMedecins = asyncHandler(async (req, res) => {
  const medecins = await Medecin.findAll();
  res.status(200).json(medecins);
});


export const getMedecinById = asyncHandler(async (req, res) => {
  const medecin = await Medecin.findByPk(req.params.id);
  if (!medecin) {
    res.status(404);
    throw new Error("Médecin non trouvé");
  }
  res.status(200).json(medecin);
});




export const updateMedecin = asyncHandler(async (req, res) => {
  const medecin = await Medecin.findByPk(req.params.id);

  if (!medecin) {
    res.status(404);
    throw new Error("Médecin non trouvé");
  }

  await medecin.update(req.body);
  res.status(200).json(medecin);
});


export const deleteMedecin = asyncHandler(async (req, res) => {
  const medecin = await Medecin.findByPk(req.params.id);

  if (!medecin) {
    res.status(404);
    throw new Error("Médecin non trouvé");
  }

  await medecin.destroy();
  res.status(200).json({ message: "Médecin supprimé avec succès" });
});

/**
 * @desc Récupérer tous les médecins en attente d'approbation
 * @route GET /api/admin/medecins/pending
 * @access Admin
 */
export const getPendingMedecins = asyncHandler(async (req, res) => {
  try {
    const medecins = await Medecin.findAll({ where: { status: "pending" } });
    res.status(200).json(medecins);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

/**
 * @desc Approuver un médecin
 * @route PUT /api/admin/medecins/:id/approve
 * @access Admin
 */
export const approveMedecin = asyncHandler(async (req, res) => {
  try {
    const medecin = await Medecin.findByPk(req.params.id);

    if (!medecin) {
      return res.status(404).json({ message: "Médecin non trouvé" });
    }

    if (medecin.status === "approved") {
      return res.status(400).json({ message: "Médecin déjà approuvé" });
    }

    await medecin.update({ status: "approved" });

    
    try {
      await sendEmailmed(
        medecin.email, 
        "Votre compte a été approuvé", 
        medecin.firstname, 
        "Félicitations, votre compte a été approuvé avec succès. Vous pouvez maintenant recevoir des rendez-vous de patients."
      );
      console.log("✅ Email d'approbation envoyé au médecin");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'email d'approbation :", error);
    }

    res.status(200).json({ message: "Médecin validé avec succès", medecin });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});
/**
 * @desc Rejeter un médecin
 * @route PUT /api/admin/medecins/:id/reject
 * @access Admin
 */
export const rejectMedecin = asyncHandler(async (req, res) => {
  try {
    const medecin = await Medecin.findByPk(req.params.id);

    if (!medecin) {
      return res.status(404).json({ message: "Médecin non trouvé" });
    }

    if (medecin.status === "rejected") {
      return res.status(400).json({ message: "Médecin déjà rejeté" });
    }

    await medecin.update({ status: "rejected" });

    
    try {
      await sendEmailmed(
        medecin.email, 
        "Votre compte a été rejeté", 
        medecin.firstname, 
        "Nous regrettons de vous informer que votre compte a été rejeté. Pour plus d'informations, veuillez contacter notre support."
      );
      console.log("✅ Email de rejet envoyé au médecin");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'email de rejet :", error);
    }

    res.status(200).json({ message: "Médecin refusé", medecin });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});
/** ============================ UTILISATEURS ============================ **/





export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.status(200).json(users);
});


export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  res.status(200).json(user);
});


export const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  await user.update({ status: "banned" });

  res.status(200).json({ message: "Utilisateur bloqué avec succès" });
});


export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  await user.destroy();
  res.status(200).json({ message: "Utilisateur supprimé avec succès" });
});


/** ============================ AVIS ============================ **/
export const getAllAvis = asyncHandler(async (req, res) => {
  const avis = await Avis.findAll();
  res.status(200).json(avis);
});

export const deleteAvis = asyncHandler(async (req, res) => {
  const avis = await Avis.findByPk(req.params.id);
  if (!avis) return res.status(404).json({ message: "Avis introuvable." });

  await avis.destroy();
  res.status(200).json({ message: "Avis supprimé avec succès." });
});


export const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.count();

  const approvedMedecins = await Medecin.count({ where: { status: "approved" } });

  // 📌 Nombre total de rendez-vous
  const totalAppointments = await Appointment.count();

  const appointmentsPerDate = await Appointment.findAll({
    attributes: [
      "date",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
    ],
    group: ["date"],
    order: [["date", "ASC"]],
    raw: true,
  });

  res.json({
    totalPatient,
    approvedMedecins,
    totalAppointments,
    appointmentsPerDate
  });
});
