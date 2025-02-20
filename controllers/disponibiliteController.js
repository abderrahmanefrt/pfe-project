import asyncHandler from "express-async-handler";
import Availability from "../models/Availability.js";

export const addDisponibilite = asyncHandler(async(req,res)=>{
const{jour,heureDebut,heureFin}=req.body;
const medecinId=req.user.id;//id from token
if(!jour|!heureDebut|!heureFin){
  return res.status(400).json({message:"Tous les champs sont obligatoires."})
}
 const disponibilite = await Availability.create({
  medecinId,
  jour,
  heureDebut,
  heureFin,
});
res.status(201).json({ message: "Disponibilité ajoutée avec succès.", disponibilite })
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