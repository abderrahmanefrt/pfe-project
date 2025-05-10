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
  const { medecinId, date, requestedTime } = req.body;
  const userId = req.user.id;
  const consultationDuration = 30; // Durée fixe de 30 minutes

  // Validation des champs
  if (!medecinId || !date || !requestedTime) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  // Vérification de la date
  const today = new Date();
  const selectedDate = new Date(date);
  if (selectedDate < today.setHours(0, 0, 0, 0)) {
    return res.status(400).json({ message: "Impossible de réserver pour une date passée." });
  }

  // Vérification utilisateur et médecin
  const [user, medecin] = await Promise.all([
    User.findByPk(userId),
    Medecin.findByPk(medecinId, {
      include: [{
        model: Availability,
        where: { date },
        required: false
      }]
    })
  ]);

  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
  if (!medecin) return res.status(404).json({ message: "Médecin non trouvé" });
  if (medecin.status !== "approved") {
    return res.status(403).json({ message: "Ce médecin n'est pas encore approuvé" });
  }

  // Vérification que le médecin est disponible ce jour-là
  if (!medecin.Availabilities || medecin.Availabilities.length === 0) {
    return res.status(400).json({ message: "Le médecin n'est pas disponible cette journée" });
  }

  // Fonctions utilitaires
  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const roundUpToNextSlot = (time) => {
    let [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const roundedMinutes = Math.ceil(totalMinutes / consultationDuration) * consultationDuration;
    const roundedHours = Math.floor(roundedMinutes / 60);
    const roundedMins = roundedMinutes % 60;
    return `${String(roundedHours).padStart(2, '0')}:${String(roundedMins).padStart(2, '0')}`;
  };

  const roundedTime = roundUpToNextSlot(requestedTime);
  const reqTime = timeToMinutes(roundedTime);
  let isTimeValid = false;
  let availabilityId = null;

  // Vérification que l'heure demandée est dans un créneau disponible
  for (const avail of medecin.Availabilities) {
    const startTime = timeToMinutes(avail.startTime);
    const endTime = timeToMinutes(avail.endTime);

    if (reqTime >= startTime && reqTime + consultationDuration <= endTime) {
      isTimeValid = true;
      availabilityId = avail.id;
      break;
    }
  }

  if (!isTimeValid) {
    return res.status(400).json({ message: "L'heure demandée n'est pas disponible dans les créneaux du médecin" });
  }

  // Récupération des rendez-vous existants ce jour-là
  const existingAppointments = await Appointment.findAll({
    where: {
      medecinId,
      date,
      status: ['pending', 'confirmed'] // Seulement les rendez-vous actifs
    },
    order: [['time', 'ASC']]
  });

  // Vérification des conflits
  for (const app of existingAppointments) {
    const appStart = timeToMinutes(app.time);
    const appEnd = appStart + consultationDuration;

    if (reqTime < appEnd && reqTime + consultationDuration > appStart) {
      return res.status(400).json({
        message: `Ce créneau est déjà réservé (${app.time})`
      });
    }
  }

  // Calcul du numéro de passage
  const startOfDay = timeToMinutes('08:00'); // Par défaut
  const passageNumber = ((reqTime - startOfDay) / consultationDuration) + 1;

  if (passageNumber < 1 || !Number.isInteger(passageNumber)) {
    return res.status(400).json({ message: "Heure de rendez-vous invalide" });
  }

  // Création du rendez-vous
  const newAppointment = await Appointment.create({
    userId,
    medecinId,
    date,
    time: roundedTime,
    availabilityId,
    numeroPassage: passageNumber,
    status: 'pending'
  });

  // Notification au médecin
  try {
    await sendEmailToDoctor(
      medecin.email,
      "Nouvelle demande de rendez-vous",
      `Vous avez une nouvelle demande de rendez-vous le ${date} à ${roundedTime} (Passage n°${passageNumber}).`
    );
  } catch (error) {
    console.error("Erreur notification médecin:", error);
  }

  res.status(201).json({
    message: `Demande de rendez-vous enregistrée à ${roundedTime} (Passage n°${passageNumber}). En attente de confirmation par le médecin.`,
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
    const { availabilityId } = req.body;
  
    if (!availabilityId) {
      return res.status(400).json({ message: "Le nouveau créneau (availabilityId) est requis." });
    }
  
    const availability = await Availability.findOne({
      where: {
        id: availabilityId,
        medecinId: appointment.medecinId
      }
    });
  
    if (!availability) {
      return res.status(404).json({ message: "Créneau de disponibilité non trouvé." });
    }
  
    // Vérifier si la date est passée
    const today = new Date();
    const availabilityDate = new Date(availability.date);
    if (availabilityDate < today.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: "Impossible de déplacer le rendez-vous vers une date passée." });
    }
  
    // Vérifier que le créneau n'est pas complet
    const appointmentsInSlot = await Appointment.count({
      where: {
        availabilityId,
      }
    });
  
    if (appointmentsInSlot >= availability.maxPatient) {
      return res.status(400).json({ message: "Ce créneau est déjà complet." });
    }
  
    // Calculer l'heure du nouveau passage
    const start = new Date(`1970-01-01T${availability.startTime}`);
    const rdvTime = new Date(start.getTime() + (appointmentsInSlot * 15 * 60000)); // 15 min/patient
    const time = rdvTime.toTimeString().substring(0, 5);
    const numeroPassage = appointmentsInSlot + 1;
  
    // Mise à jour
    appointment.availabilityId = availability.id;
    appointment.date = availability.date;
    appointment.time = time;
    appointment.numeroPassage = numeroPassage;
  }
  

  // ✅ Si c’est le médecin qui veut changer le statut
  if (userRole === "medecin" && appointment.medecinId === userId && status) {
    appointment.status = status;
  }

  await appointment.save();
  await appointment.reload();

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

