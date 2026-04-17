const Signature = require('../models/Signature.model');

exports.getSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find({ user_id: req.user.id });
    res.json(signatures);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des signatures' });
  }
};

exports.createSignature = async (req, res) => {
  try {
    const { signature_data, name } = req.body;
    const newSignature = await Signature.create({
      user_id: req.user.id,
      signature_data,
      name
    });
    res.status(201).json(newSignature);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création de la signature' });
  }
};

exports.deleteSignature = async (req, res) => {
  try {
    const result = await Signature.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!result) return res.status(404).json({ message: 'Signature non trouvée' });
    res.json({ message: 'Signature supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};
