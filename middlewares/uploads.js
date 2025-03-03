import fs from "fs";
import path from "path";
import multer from "multer";

// Création des dossiers s'ils n'existent pas
const documentDir = "uploads/documents";
const photoDir = "uploads/photos";

[documentDir, photoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Configuration du stockage des photos (JPG/PNG)
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photoDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Filtre pour vérifier le type de fichier
const fileFilter = (fileType) => (req, file, cb) => {
  const allowedTypes = fileType === "document" ? ["application/pdf"] : ["image/jpeg", "image/png"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Seuls les fichiers ${fileType === "document" ? "PDF" : "JPG/PNG"} sont autorisés.`), false);
  }
};

// Middleware de téléchargement des fichiers
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "document") {
        cb(null, documentDir);
      } else if (file.fieldname === "photo") {
        cb(null, photoDir);
      } else {
        cb(new Error("Champ de fichier non reconnu"), false);
      }
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "document") {
      fileFilter("document")(req, file, cb);
    } else if (file.fieldname === "photo") {
      fileFilter("photo")(req, file, cb);
    } else {
      cb(new Error("Champ de fichier non reconnu"), false);
    }
  },
  limits: {
    fileSize: (req, file, cb) => {
      if (file.fieldname === "document") {
        cb(null, 5 * 1024 * 1024); // 5 Mo max pour les documents
      } else if (file.fieldname === "photo") {
        cb(null, 2 * 1024 * 1024); // 2 Mo max pour les photos
      } else {
        cb(new Error("Champ de fichier non reconnu"), false);
      }
    },
  },
});

export default upload;
