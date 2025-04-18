import asyncHandler from "express-async-handler";
import Appointment from "../models/Appointment.js";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";
import Availability from "../models/Availability.js";
import { sendEmailapp } from "../utils/email.js"
import { Op, Sequelize } from 'sequelize';

/**  
 * @desc Create an appointment (Only for users)
 * @route POST /api/appointments
 * @access Private (User)
 */


export const createAppointment = asyncHandler(async (req, res) => {
  const { userId, medecinId, date } = req.body;

  if (!userId || !medecinId || !date) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  const medecin = await Medecin.findByPk(medecinId);
  if (!medecin) return res.status(404).json({ message: "Médecin non trouvé" });

  if (medecin.status !== "approved") {
    return res.status(403).json({ message: "Ce médecin n'est pas encore approuvé" });
  }

  // Vérifier la disponibilité du médecin
  const availability = await Availability.findOne({
    where: { medecinId, date }
  });

  if (!availability) {
    return res.status(400).json({ message: "Aucune disponibilité trouvée pour cette date" });
  }

  // Compter les rendez-vous déjà pris pour cette date
  const appointmentCount = await Appointment.count({
    where: {
      medecinId,
      date
    }
  });

  const maxPatients = availability.maxPatient;

  if (appointmentCount >= maxPatients) {
    return res.status(400).json({
      message: "Le médecin a atteint le nombre maximal de rendez-vous pour ce créneau."
    });
  }

  const numeroPassage = appointmentCount + 1;

  // Créer le rendez-vous
  const newAppointment = await Appointment.create({
    userId,
    medecinId,
    date,
    numeroPassage,
    status: "pending"
  });

  // Envoi e-mail confirmation
  try {
    await sendEmailapp(
      user.email,
      "Confirmation de rendez-vous",
      user.firstname,
      user.lastname,
      date,
      null, // Pas besoin de l'heure
      medecin.firstname,
      medecin.lastname
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
  }

  res.status(201).json({
    message: `Rendez-vous créé avec succès. Vous êtes le ${numeroPassage}ᵉ patient pour ce créneau.`,
    appointment: newAppointment
  });
});











/**  
 * @desc Get all appointments (Admin only)
 * @route GET /api/appointments
 * @access Private (Admin)
 */
export const getAllAppointments = asyncHandler(async (req, res) => {
  let appointments;

  if (req.isPatient) {
    appointments = await Appointment.findAll({
      where: { userId: req.user.id },
      include: [
        { 
          model: User, 
          attributes: ["id", "firstname", "lastname", "email"] 
        },
        { 
          model: Medecin, 
          attributes: ["firstname", "lastname"]  // Seulement le prénom et le nom
        },
      ],
    });
  } else {
    appointments = await Appointment.findAll({
      include: [
        { 
          model: User, 
          attributes: ["id", "firstname", "lastname", "email"] 
        },
        { 
          model: Medecin, 
          attributes: ["firstname", "lastname"]  // Seulement le prénom et le nom
        },
      ],
    });
  }

  res.status(200).json(appointments);
});

/**  
 * @desc Get a single appointment
 * @route GET /api/appointments/:id
 * @access Private (User/Admin)
 */
export const getAppointmentById = asyncHandler(async (req, res) => {
  
  const { id } = req.params;
  
  const appointment = await Appointment.findByPk(id, {
    include: [
      { model: User, attributes: ["id", "firstname","lastname", "email"] },
      { model: Medecin, attributes: ["id", "firstname","lastname", "specialite"] },
    ],
  });

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  res.status(200).json(appointment);
});

/**  
 * @desc Update appointment status (User can update, Admin can approve/reject)
 * @route PUT /api/appointments/:id
 * @access Private (User/Admin)
 */
export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, time, status } = req.body;
  const userId = req.user.id;

  const appointment = await Appointment.findByPk(id);
  if (!appointment) {
    return res.status(404).json({ message: "Rendez-vous non trouvé." });
  }

  // Vérifier si c'est le patient qui veut modifier son rendez-vous
  if (appointment.userId === userId) {
    // Vérifier la disponibilité du médecin
    const availabilities = await Availability.findAll({
      where: { medecinId: appointment.medecinId, date },
    });

    if (!availabilities || availabilities.length === 0) {
      return res.status(400).json({ message: "Aucune disponibilité trouvée pour cette date" });
    }

    const isAvailable = availabilities.some(avail =>
      new Date(`1970-01-01T${time}Z`) >= new Date(`1970-01-01T${avail.startTime}Z`) &&
      new Date(`1970-01-01T${time}Z`) <= new Date(`1970-01-01T${avail.endTime}Z`)
    );

    if (!isAvailable) {
      return res.status(400).json({ message: "L'heure choisie n'est pas dans la plage horaire du médecin." });
    }

    // Vérifier si l'heure est déjà prise
    const existingAppointment = await Appointment.findOne({
      where: { medecinId: appointment.medecinId, date, time, id: { $ne: appointment.id } }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "Ce créneau est déjà réservé." });
    }

    // Mettre à jour la date et l'heure
    appointment.date = date;
    appointment.time = time;
  } 
  
  // Vérifier si l'admin peut mettre à jour le statut
  if (req.user.role === "admin" && status) {
    appointment.status = status;
  }

  await appointment.save();

  res.status(200).json({ message: "Rendez-vous mis à jour avec succès.", appointment });
});


/**  
 * @desc Approve an appointment (Admin only)
 * @route PUT /api/appointments/:id/approve
 * @access Private (Admin)
 */
export const approveAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findByPk(id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  await appointment.update({ status: "approved" });
  res.status(200).json({ message: "Appointment approved successfully." });
});

/**  
 * @desc Reject an appointment (Admin only)
 * @route PUT /api/appointments/:id/reject
 * @access Private (Admin)
 */
export const rejectAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findByPk(id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  await appointment.update({ status: "rejected" });
  res.status(200).json({ message: "Appointment rejected successfully." });
});

/**  
 * @desc Delete an appointment (User can delete own, Admin can delete any)
 * @route DELETE /api/appointments/:id
 * @access Private (User/Admin)
 */
export const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const appointment = await Appointment.findByPk(id);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (appointment.userId !== userId && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied." });
  }

  await appointment.destroy();
  res.status(200).json({ message: "Appointment successfully canceled." });
});

export const getMedecinAppointments =asyncHandler(async(req,res)=>{

  const medecinId=req.user.id;
  const appointments = await Appointment.findAll({
    where: { medecinId },
    include: [
      { model: User, attributes: ["id", "firstname","lastname", "email"] },
    ],
  });

  res.status(200).json(appointments);
});

/**  
 * @desc Accept or reject an appointment (Medecin only)
 * @route PUT /api/appointments/:id/status
 * @access Private (Medecin)
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const medecinId = req.user.id;

  const appointment = await Appointment.findByPk(id);

  if (!appointment) {
    return res.status(404).json({ message: "Rendez-vous non trouvé." });
  }

  if (appointment.medecinId !== medecinId) {
    return res.status(403).json({ message: "Accès refusé." });
  }

  if (!["accepter", "refuser"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json({ message: `Rendez-vous ${status} avec succès.`, appointment });
});

