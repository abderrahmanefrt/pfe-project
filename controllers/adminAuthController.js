import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const loginAdmin = (req, res) => {
  const { email, password } = req.body;

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }

  const token = jwt.sign(
    { role: "admin" }, 
    process.env.JWT_SECRET, 
    { expiresIn: "7d" }
  );

  res.json({ message: "Connexion réussie", token });
};
