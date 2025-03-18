import asyncHandler from "express-async-handler";
import Appointment from "../models/Appointment.js";
import User from "../models/Users.js";
import Medecin from "../models/Medecin.js";
import Availability from "../models/Availability.js";
import { sendEmailapp } from "../utils/email.js"
/**  
 * @desc Create an appointment (Only for users)
 * @route POST /api/appointments
 * @access Private (User)
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const { userId, medecinId, date, time } = req.body;

  if (!userId || !medecinId || !date || !time) {
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
  console.log("Availability model:", Availability);
  const availabilities = await Availability.findAll({
    where: { medecinId, date },
  });

  if (!availabilities || availabilities.length === 0) {
    return res.status(400).json({ message: "Aucune disponibilité trouvée pour cette date" });
  }

  console.log("🔎 Vérification des disponibilités du médecin :");
  availabilities.forEach(avail => {
    console.log(`📅 Date: ${avail.date}, ⏳ StartTime: ${avail.startTime}, ⌛ EndTime: ${avail.endTime}`);
  });

  // Vérifier si l'heure demandée est dans l'un des créneaux disponibles
  const isAvailable = availabilities.some(avail =>
    new Date(`1970-01-01T${time}Z`) >= new Date(`1970-01-01T${avail.startTime}Z`) &&
    new Date(`1970-01-01T${time}Z`) <= new Date(`1970-01-01T${avail.endTime}Z`)
  );

  if (!isAvailable) {
    return res.status(400).json({ message: "L'heure choisie n'est pas dans la plage horaire du médecin." });
  }

  console.log("✅ L'heure demandée est bien dans la plage horaire du médecin");

  // Vérifier si un autre rendez-vous est déjà pris
  const existingAppointment = await Appointment.findOne({ where: { medecinId, date, time } });
  if (existingAppointment) {
    return res.status(400).json({ message: "Ce créneau est déjà réservé." });
  }

  // Création du rendez-vous
  const newAppointment = await Appointment.create({ userId, medecinId, date, time });

  // Envoi de l'email de confirmation
  try {
    await sendEmailapp(
      user.email,
      "Confirmation de rendez-vous",
      user.name,
      date,
      time,
      medecin.name
    );
    console.log("✅ Email de confirmation envoyé au patient");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
  }

  res.status(201).json({ message: "Rendez-vous créé avec succès", appointment: newAppointment });
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
      include: [{ model: Medecin, attributes: ["id", "name", "specialite"] }],
    });
  } else {
    
    appointments = await Appointment.findAll({
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Medecin, attributes: ["id", "name", "specialite"] },
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
      { model: User, attributes: ["id", "name", "email"] },
      { model: Medecin, attributes: ["id", "name", "specialite"] },
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
  const { status } = req.body;
  const userId = req.user.id;

  const appointment = await Appointment.findByPk(id);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  // User can update only their appointment, admin can approve/reject
  if (appointment.userId !== userId && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied." });
  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json({ message: "Appointment updated successfully.", appointment });
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
      { model: User, attributes: ["id", "name", "email"] },
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

