const Stats = require('../models/Stats.model');

exports.getMyStats = async (req, res) => {
  try {
    const stats = await Stats.findOne({ user_id: req.user.id });
    res.json(stats || {
      total_signed: 0,
      total_merged: 0,
      total_split: 0,
      total_compressed: 0,
      total_converted: 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des stats' });
  }
};

exports.getGlobalStats = async (req, res) => {
  // Optionnel: vérifier si admin
  try {
    const globalStats = await Stats.aggregate([
      {
        $group: {
          _id: null,
          total_signed: { $sum: '$total_signed' },
          total_merged: { $sum: '$total_merged' },
          total_split: { $sum: '$total_split' },
          total_compressed: { $sum: '$total_compressed' },
          total_converted: { $sum: '$total_converted' }
        }
      }
    ]);
    res.json(globalStats[0] || {});
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des stats globales' });
  }
};
