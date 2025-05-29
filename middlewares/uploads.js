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

// Middleware pour gérer les erreurs d'upload
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "Le fichier est trop volumineux (max 5 Mo)" });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Middleware pour uploader vers Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.files) return next();

    // Traiter les photos
    if (req.files.photo) {
      for (const file of req.files.photo) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'medecins/photos',
          resource_type: 'image'
        });
        req.body.photo = result.secure_url;
        // Supprimer le fichier temporaire
        fs.unlinkSync(file.path);
      }
    }

    // Traiter les documents
    if (req.files.document) {
      for (const file of req.files.document) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'medecins/documents',
          resource_type: 'raw'
        });
        req.body.document = result.secure_url;
        // Supprimer le fichier temporaire
        fs.unlinkSync(file.path);
      }
    }

    next();
  } catch (error) {
    console.error('Erreur lors de l\'upload vers Cloudinary:', error);
    return res.status(500).json({ error: "Erreur lors de l'upload des fichiers" });
  }
};

export const uploadMedecinFiles = upload.fields([
  { name: "document", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);

export default upload;
