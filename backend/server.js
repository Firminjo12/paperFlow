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

const app = express();

// Middleware de sécurité
app.use(helmet());
app.use(cors()); // Permissif par défaut pour le développement local

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

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API SignFlow' });
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
