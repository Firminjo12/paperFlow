const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const admin = require('../config/firebase');

exports.register = async (req, res) => {
  const { email, password, full_name } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      full_name
    });

    const jwt_token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ jwt_token, user: userResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'L\'email et le mot de passe sont requis' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`[AUTH] Échec de connexion : Utilisateur introuvable (${normalizedEmail})`);
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[AUTH] Échec de connexion : Mot de passe incorrect (${normalizedEmail})`);
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const jwt_token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ jwt_token, user: userResponse });
  } catch (err) {
    console.error(`[AUTH_ERROR] Erreur serveur lors de la connexion:`, err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Token Google manquant' });
  }

  try {
    // 1. Vérifier le token Google avec Firebase Admin
    console.log(`[AUTH] Tentative de connexion Google...`);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    if (!decodedToken) {
      throw new Error('Token Google vide après décodage');
    }

    const { email, name, picture, uid } = decodedToken;
    console.log(`[AUTH] Token Google valide pour: ${email}`);

    // 2. Chercher ou créer l'utilisateur dans MongoDB
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Création automatique si premier login Google
      user = await User.create({
        email: email.toLowerCase(),
        full_name: name || email.split('@')[0],
        avatar_url: picture,
        role: 'user',
        // On n'assigne pas de mot de passe, l'utilisateur devra utiliser Google ou Reset Password
      });
      console.log(`[AUTH] Nouvel utilisateur créé via Google : ${email} (UID: ${uid})`);
    } else {
      // Mettre à jour l'avatar si nécessaire
      if (picture && !user.avatar_url) {
        user.avatar_url = picture;
        await user.save();
      }
      console.log(`[AUTH] Utilisateur existant connecté via Google : ${email}`);
    }

    // 3. Générer le JWT local paperFlow
    const jwt_token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    if (userResponse.password) delete userResponse.password;

    res.json({ 
      jwt_token, 
      user: userResponse,
      message: 'Authentification Google réussie' 
    });
  } catch (err) {
    console.error(`[AUTH_ERROR] Erreur Google Login:`, err.message);
    res.status(401).json({ 
      message: 'Authentification Google invalide',
      error: err.message 
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { full_name, avatar_url, updated_at: Date.now() } },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
};

exports.forgotPassword = async (req, res) => {
  // Simuler l'envoi d'un email
  res.json({ message: 'Lien de réinitialisation envoyé' });
};
