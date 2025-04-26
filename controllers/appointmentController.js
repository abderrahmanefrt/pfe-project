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
  const { medecinId, date, availabilityId } = req.body;
  const userId = req.user.id;

  if (!medecinId || !date || !availabilityId) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  const medecin = await Medecin.findByPk(medecinId);
  if (!medecin) return res.status(404).json({ message: "Médecin non trouvé" });

  if (medecin.status !== "approved") {
    return res.status(403).json({ message: "Ce médecin n'est pas encore approuvé" });
  }

  const availability = await Availability.findOne({
    where: { id: availabilityId, medecinId, date },
  });

  if (!availability) {
    return res.status(404).json({ message: "Créneau de disponibilité non trouvé" });
  }

  // Vérifier que le patient n'a pas déjà un rendez-vous ce jour-là
  const alreadyHasAppointment = await Appointment.findOne({
    where: {
      userId,
      medecinId, 
      date,
    }
  });
  

  if (alreadyHasAppointment) {
    return res.status(400).json({
      message: "Vous avez déjà un rendez-vous pour ce jour-là.",
    });
  }

  // Vérifier le nombre de patients déjà inscrits dans ce créneau
  const appointmentsInCreneau = await Appointment.count({
    where: {
      medecinId,
      date,
      time: {
        [Op.between]: [availability.startTime, availability.endTime]
      }
    }
  });

  if (appointmentsInCreneau >= availability.maxPatient) {
    return res.status(400).json({ message: "Ce créneau est complet." });
  }

  // Calcul de l'heure du patient (simple incrémentation)
  const start = new Date(`1970-01-01T${availability.startTime}`);
  const rdvTime = new Date(start.getTime() + (appointmentsInCreneau * 15 * 60000)); // 15 minutes par patient

  const time = rdvTime.toTimeString().substring(0, 5); // format HH:mm
  const numeroPassage = appointmentsInCreneau + 1;

  const newAppointment = await Appointment.create({
    userId,
    medecinId,
    date,
    time,
    numeroPassage
  });

  // Envoi de l'e-mail
  try {
    await sendEmailapp(
      user.email,
      "Confirmation de rendez-vous",
      user.firstname,
      user.lastname,
      date,
      time,
      medecin.firstname,
      medecin.lastname
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
  }

  res.status(201).json({
    message: `Rendez-vous créé avec succès à ${time}. Vous êtes le ${numeroPassage}ᵉ patient pour ce créneau.`,
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

  const today = new Date(); // Date actuelle

  if (req.isPatient) {
    // Si c'est un patient, on récupère seulement ses futurs rendez-vous
    appointments = await Appointment.findAll({
      where: { 
        userId: req.user.id,
        date: {
          [Op.gte]: today // uniquement les rendez-vous aujourd'hui ou après
        }
      },
      include: [
        { 
          model: User, 
          attributes: ["id", "firstname", "lastname", "email"] 
        },
        { 
          model: Medecin, 
          attributes: ["id", "firstname", "lastname"] 
        },
      ],
      order: [
        ["date", "ASC"],
        ["time", "ASC"]
      ]
    });
  } else {
    // Si c'est un admin, on récupère tous les rendez-vous futurs
    appointments = await Appointment.findAll({
      where: {
        date: {
          [Op.gte]: today
        }
      },
      include: [
        { 
          model: User, 
          attributes: ["id", "firstname", "lastname", "email"] 
        },
        { 
          model: Medecin, 
          attributes: ["id", "firstname", "lastname"] 
        },
      ],
      order: [
        ["date", "ASC"],
        ["time", "ASC"]
      ]
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
  const userRole = req.user.role;

  const appointment = await Appointment.findByPk(id);
  if (!appointment) {
    return res.status(404).json({ message: "Rendez-vous non trouvé." });
  }

  if (appointment.status === "accepter") {
    return res.status(403).json({ message: "Rendez-vous déjà accepté, il ne peut plus être modifié." });
  }

  // ✅ Si c’est le patient qui modifie sa date/heure
  if (userRole === "patient" && appointment.userId === userId) {
    if (!date || !time) {
      return res.status(400).json({ message: "Date et heure requises." });
    }

    // Vérifier la disponibilité du médecin à la date donnée
    const availabilities = await Availability.findAll({
      where: { medecinId: appointment.medecinId, date },
    });

    if (availabilities.length === 0) {
      return res.status(400).json({ message: "Aucune disponibilité pour cette date." });
    }

    const isAvailable = availabilities.some(avail =>
      new Date(`1970-01-01T${time}Z`) >= new Date(`1970-01-01T${avail.startTime}Z`) &&
      new Date(`1970-01-01T${time}Z`) <= new Date(`1970-01-01T${avail.endTime}Z`)
    );

    if (!isAvailable) {
      return res.status(400).json({ message: "L'heure n'est pas dans les créneaux disponibles du médecin." });
    }

    // Vérifier si l'heure est déjà réservée
    const existing = await Appointment.findOne({
      where: {
        medecinId: appointment.medecinId,
        date,
        time,
        id: { [Op.ne]: appointment.id }
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Ce créneau est déjà réservé." });
    }

    appointment.date = date;
    appointment.time = time;
  }

  // ✅ Si c’est le médecin qui veut changer le statut
  if (userRole === "medecin" && appointment.medecinId === userId && status) {
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

