import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Vérification des variables d'environnement
console.log('🔑 Configuration Cloudinary:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configuré' : '❌ Manquant');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Configuré' : '❌ Manquant');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Configuré' : '❌ Manquant');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary; 