# 📝 Rapport de Présentation du Projet : **paperFlow**

![Status](https://img.shields.io/badge/Status-En_Développement_Actif-brightgreen?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![Licence](https://img.shields.io/badge/Licence-Private-red?style=for-the-badge)

## 1. 🌟 Présentation du Projet

* **Nom** : paperFlow
* **Description** : Application web innovante de gestion, conversion et signature sécurisée de documents PDF et Office. Conçue pour offrir un environnement tout-en-un fluide.
* **URL de Production** : [paperflow.netlify.app](https://paperflow.netlify.app)
* **Statut** : En développement actif (phase de transition vers de l'hybride/Mobile).

---

## 2. 🛠️ Stack Technique Complète

### 🎨 Frontend
| Technologie | Logo/Badge | Rôle Principal |
|-------------|--------|----------------|
| **React 18 + Vite** | ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) | Cœur de l'application cliente et compilation ultra-rapide |
| **Tailwind CSS** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | Design UI Premium et architecture responsive |
| **react-router-dom** | ![Router](https://img.shields.io/badge/Router-Nav-gray) | Gestion de la navigation côté client (SPA) |
| **Lucide React** | ![Lucide](https://img.shields.io/badge/Icons-Lucide-pink) | Set d'icônes modernes et ultra-légères |
| **pdf-lib** | ![PDF](https://img.shields.io/badge/PDF_Lib-Doc-red) | Création, modification et chiffrement natif des PDF |
| **pdf.js / react-pdf** | ![PDF](https://img.shields.io/badge/PDF.js-Viewer-blue) | Affichage asynchrone des prévisualisations PDF |
| **Tesseract.js** | ![OCR](https://img.shields.io/badge/OCR-Tesseract-purple) | Reconnaissance optique de caractères (JS pur) |
| **dnd-kit** | ![DND](https://img.shields.io/badge/Drag_Drop-Kit-orange) | Interface de réorganisation de pages et Drag&Drop |

### ⚙️ Backend
| Technologie | Logo/Badge | Rôle Principal |
|-------------|--------|----------------|
| **Node.js + Express** | ![Node](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white) | API HTTP et serveur applicatif asynchrone |
| **MongoDB + Mongoose** | ![Mongo](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white) | Base de données NoSQL pour stocker l'historique et les users |
| **LibreOffice** | ![LO](https://img.shields.io/badge/LibreOffice-Convert-black) | Conversion haute fidélité (Word/PPTX/Excel vers PDF) |
| **JWT & Bcrypt.js** | ![Sec](https://img.shields.io/badge/Security-Auth-yellow) | Création de tokens d'accès et hachage des mots de passe |
| **Multer** | ![Upload](https://img.shields.io/badge/Multer-Uploads-teal) | Middleware pour intercepter les fichiers entrants |
| **Helmet & CORS** | ![Sec](https://img.shields.io/badge/Helmet-Security-darkred) | Protections des en-têtes HTTP de l'API |

### 🔐 Authentification & Déploiement
* **Méthodes :** Supabase Auth, OAuth Google & Facebook, JWT Personnalisé (hybride).
* **Déploiement Frontend :** Netlify.
* **Déploiement Backend :** Render (prévu).
* **Database :** MongoDB Atlas.

---

## 3. 🎯 Fonctionnalités Disponibles

### 📄 Outils PDF (Locaux et Gratuits)
- [x] Signer un PDF
- [x] Fusionner des PDFs
- [x] Diviser un PDF
- [x] Compresser un PDF
- [x] Pivoter un PDF
- [x] Extraire des pages
- [x] Supprimer des pages
- [x] Organiseur PDF
- [x] Modifier PDF (ajout de texte & image)
- [x] Filigrane PDF
- [x] Déverrouiller PDF (100% Client-Side via `pdf-lib`)

### 🔄 Conversions (Backend LibreOffice)
- [x] Word en PDF
- [x] PowerPoint en PDF
- [x] PDF en Word
- [x] PDF en PowerPoint
- [x] JPG en PDF
- [x] PDF en JPG

### 💎 Fonctionnalités Premium
- 🔒 **Traduction PDF** (via MyMemory API)
- 🔒 **OCR PDF** (Extraction de texte via Tesseract.js)
- 🔒 **Protéger PDF** (Chiffrement AES)
- 🔒 **Numériser PDF** (Accès Caméra)
- ⏳ *Réparer PDF (Prochainement)*
- ⏳ *PDF en PDF/A (Prochainement)*

### 👤 Système Utilisateur
- [x] Inscription / Connexion avec Dashboard
- [x] Historique des documents & Profil utilisateur
- [x] Signatures sauvegardées en base de données
- [x] Système de notation (Reviews)

---

## 4. 🗂️ Structure du Projet & Architecture

Voici l'organisation globale du dépôt. Le projet est découpé selon le modèle standard Monorepo / MERN.

```ascii
paperflow/
├── frontend/                     # Application React cliente
│   ├── public/                   # Fichiers statiques (favicon, sitemap)
│   ├── src/
│   │   ├── components/           # Composants UI (Boutons, Modales, Headers)
│   │   │   ├── auth/             # Formulaires Login/Register
│   │   │   ├── dashboard/        # Vues du panel utilisateur
│   │   │   └── tools/            # Outils spécifiques (Drag&Drop, Canvas)
│   │   ├── context/              # Gestions globales (ex: AuthContext)
│   │   ├── pages/                # Les +30 Pages correspondantes aux outils PDF
│   │   ├── services/             # Appels HTTP (api.js, supabase client)
│   │   ├── hooks/                # Custom React Hooks
│   │   └── utils/                # Fonctions d'aides (maths, formats)
│   └── vite.config.js            # Configuration du bundler Vite
│
└── backend/                      # API Node Express
    ├── src/
    │   ├── controllers/          # Logique métier associée aux routes
    │   ├── models/               # Schémas Mongoose
    │   │   ├── User.model.js
    │   │   ├── Document.model.js
    │   │   ├── Signature.model.js
    │   │   ├── Review.model.js
    │   │   └── Stats.model.js
    │   ├── routes/               # Déclarations des requêtes (GET, POST. ex: convert.routes.js)
    │   ├── middleware/           # Intercepteurs (ex: authMiddleware.js)
    │   └── utils/                # Aides backend (ex: libération de processus)
    └── server.js                 # Point d'entrée asynchrone principal
```

---

## 5. 💻 Installation et Environnement (Local)

### A. Prérequis Système
* Node.js v18 ou supérieur
* Une instance MongoDB MongoDB (Locale ou Atlas)
* Projet Supabase configuré
* **LibreOffice** (doit être installé sur l'OS pour les conversions compliquées)
* Git

### B. Variables d'environnement (`.env`)

**Dans le dossier `/frontend/.env` :**
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clef_anon_supabase
VITE_API_URL=http://localhost:5000
```

**Dans le dossier `/backend/.env` :**
```env
PORT=5000
MONGODB_URI=votre_uri_mongodb
JWT_SECRET=clef_secrete_ultra_robuste
SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_KEY=clef_service_role
FRONTEND_URL=http://localhost:5173
LIBREOFFICE_PATH="C:\\Program Files\\LibreOffice\\program\\soffice.exe" # Si Windows
```

### C. Lancement Rapide

1. Cloner le répertoire complet :
   ```bash
   git clone [URL_DU_REPO]
   cd paperflow
   ```
2. Installer les paquets simultanément :
   ```bash
   # Un script personnalisé à la racine gère l'installation multiple.
   npm run install-all
   ```
3. Lancer l'environnement de développement :
   ```bash
   npm run dev
   ```

---

## 6. 🐛 Bugs Connus et Corrections En Cours

1. **DOM React (Crash) :** Erreurs `insertBefore/removeChild` survenant parfois lors de transitions rapides entre les composants.
2. **REST Limitation :** La traduction PDF (API MyMemory) bloque à **500 caractères** par requête, nécessitant un mécanisme de découpage (chunking) avancé.
3. **Sécurité :** L'outil "Protéger PDF" s'appuie encore sur certaines méthodes Backend.
4. **En Construction :** Outils de censure et de rognage PDF en rodage.

---

## 7. 🚀 Roadmap Future

* [ ] **Déploiement Backend :** Hébergement de l'API Node et paramétrage de LibreOffice sur Render.
* [ ] **Monétisation :** Intégration de passerelles de paiement (ex: Mobile Money).
* [ ] **Amélioration IA Translations :** Installation d'une instance LibreTranslate dédiée sur Render et substitution de MyMemory.
* [ ] **Qualité :** Mise en place d'une suite de Tests E2E Automatisés.
* [ ] **Mobile :** Portage en applications Natives via **Capacitor**.

---

## 8. 🤝 Guide de Contribution (New Developers)

Pour tous les développeurs rejoignant paperFlow, voici le workflow demandé :

1. **Pull des Modifications** : Créez toujours une nouvelle branche depuis `main` avant de coder (ex: `feature/nom-de-loutil`).
2. **Zéro-serveur si possible** : Si un outil peut fonctionner à 100% en local (navigateur) grâce à `pdf-lib` (ex: UnlockTool, Merge), **privilégiez cette approche**. Cela économise le serveur Node et protège les données.
3. **Composants Réutilisables** : Utilisez les composants Tailwind du dossier `frontend/src/components/` (ex: `FileDropzone.jsx`). Ne refaites pas les boutons.
4. **Validations** : Ajoutez vos variables `.env` discrètement et ne commitez jamais les fichiers `.env` finaux.
5. **PR (Pull Request)** : Une fois achevé, ouvrez une PR sur GitHub avec une description des tests menés.
