require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth.routes');
const signatureRoutes = require('./src/routes/signature.routes');
const documentRoutes = require('./src/routes/document.routes');
const reviewRoutes = require('./src/routes/review.routes');
const statsRoutes = require('./src/routes/stats.routes');
const convertRoutes = require('./src/routes/convert.routes');
const aiRoutes = require('./src/routes/ai.routes');
const storageRoutes = require('./src/routes/storage.routes');
const path = require('path');

const app = express();

// Middleware de sécurité optimisé pour les popups Firebase / Google
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Permet aux popups Google de fonctionner
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // On autorise les deux variantes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requêtes par IP
});
app.use(limiter);

// Middleware standard
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/storage', storageRoutes);

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API paperFlow' });
});

// Connexion MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connecté ✅');
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT} 🚀`);
    });
  })
  .catch(err => {
    console.error('Erreur de connexion MongoDB ❌', err);
    process.exit(1);
  });
