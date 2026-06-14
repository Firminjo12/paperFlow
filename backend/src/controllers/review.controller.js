const Review = require('../models/Review.model');

exports.getReviews = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reviews = await Review.find(filter).populate('user_id', 'full_name avatar_url').sort({ created_at: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des avis' });
  }
};

exports.postReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({
      user_id: req.user.id,
      rating,
      comment
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'avis' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { status: 'approved' } }, // Stat seulement sur les avis approuvés
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    res.json(stats[0] || { averageRating: 0, totalReviews: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du calcul des stats' });
  }
};

// --- MÉTHODES ADMIN ---

// Mettre à jour le statut (approve/reject)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la modération' });
  }
};

// Supprimer définitivement
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Avis supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

