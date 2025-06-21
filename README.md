# 🏥 Plateforme de Gestion des Rendez-vous Médicaux

Une plateforme complète de prise de rendez-vous médicaux développée avec **Node.js, Express, PostgreSQL, React et Flutter**. Elle facilite la gestion des consultations pour les patients, médecins et administrateurs.

---

## 🚀 Fonctionnalités

### 👤 Patients
- Inscription et connexion sécurisée (JWT)
- Prise de rendez-vous selon les créneaux disponibles
- Consultation du profil et des rendez-vous passés
- Recherche de médecins proches via géolocalisation
- Ajout d'avis sur les médecins

### 🩺 Médecins
- Inscription avec validation des documents
- Ajout et gestion de disponibilités
- Suivi des rendez-vous
- Mise à jour du profil et du mot de passe
- Accès restreint avant validation par l’admin

### 🛡️ Admin
- Validation ou refus des comptes médecins
- Statistiques (patients, médecins, rendez-vous)
- Gestion des utilisateurs, avis et rendez-vous

---

## 🛠️ Stack technique

- **Backend** : Node.js, Express.js, Sequelize, PostgreSQL
- **Frontend** :
  - Web : React.js
  - Mobile (optionnel) : Flutter
- **Authentification** : JWT (avec rôles)
- **Emailing** : Nodemailer
- **Géolocalisation** : OpenStreetMap / Nominatim
- **Déploiement** : Render

---

## 📦 Installation

### Backend

```bash
git clone https://github.com/ton-compte/nom-du-projet.git
cd backend
npm install
cp .env.example .env
# configure les variables : DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET, etc.
npm run dev
