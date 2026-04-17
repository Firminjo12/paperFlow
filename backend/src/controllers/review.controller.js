const Review = require('../models/Review.model');

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('user_id', 'full_name avatar_url').sort({ created_at: -1 });
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
