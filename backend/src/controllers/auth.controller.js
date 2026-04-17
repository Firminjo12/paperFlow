const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

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
