import Medecin from "./Medecin.js";
import Appointment from "./Appointment.js";
import User from "./Users.js";
import Availability from "./Availability.js"
import Avis from "./Avis.js";

Medecin.hasMany(Appointment, { foreignKey: "medecinId", onDelete: "CASCADE" });
Appointment.belongsTo(Medecin, { foreignKey: "medecinId", onDelete: "CASCADE" });

User.hasMany(Appointment, { foreignKey: "userId", onDelete: "CASCADE" });
Appointment.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

Availability.belongsTo(Medecin, { foreignKey: "medecinId", onDelete: "CASCADE" });
Medecin.hasMany(Availability, { foreignKey: "medecinId", onDelete: "CASCADE" });
Medecin.hasMany(Avis, { foreignKey: "medecinId", as: "avis" });
Medecin.hasMany(Availability, { foreignKey: "medecinId", as: "availabilities" });
export default { Medecin, Appointment, User ,Availability};
