import fs from "fs";
import path from "path";
import multer from "multer";

const documentDir = "uploads/documents";
const photoDir = "uploads/photos";

[documentDir, photoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "document") cb(null, documentDir);
    else if (file.fieldname === "photo") cb(null, photoDir);
    else cb(new Error("Champ de fichier non reconnu"), false);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "document") {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Seuls les fichiers PDF sont autorisés."), false);
  } else if (file.fieldname === "photo") {
    if (["image/jpeg", "image/png"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Seuls les fichiers JPG/PNG sont autorisés."), false);
  } else {
    cb(new Error("Champ de fichier non reconnu"), false);
  }
};

// 5 Mo max pour tout fichier (tu peux séparer si besoin avec des middlewares différents)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadMedecinFiles = upload.fields([
  { name: "document", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);
export default upload;
