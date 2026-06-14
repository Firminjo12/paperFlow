const Document = require('../models/Document.model');
const Stats = require('../models/Stats.model');

exports.getHistory = async (req, res) => {
  try {
    const history = await Document.find({ user_id: req.user.id }).sort({ signed_at: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique' });
  }
};

exports.logDocument = async (req, res) => {
  try {
    const { file_name, file_size, action, pages_count, convert_type, file_url } = req.body;
    
    const doc = await Document.create({
      user_id: req.user.id,
      file_name,
      file_size,
      action,
      convert_type,
      pages_count,
      file_url
    });

    // Mettre à jour les stats
    // On mappe l'action vers le bon nom de champ dans les stats
    const actionToField = {
      'sign': 'total_signed',
      'merge': 'total_merged',
      'compress': 'total_compressed',
      'convert': 'total_converted',
      'delete-pages': 'total_delete_pages',
      'extract': 'total_extract',
      'organize': 'total_organize',
      'split': 'total_split',
      'rotate': 'total_rotate',
      'ocr': 'total_ocr',
      'watermark': 'total_watermark',
      'page-numbers': 'total_page_numbers',
      'translate': 'total_translate',
      'scan': 'total_scan',
      'repair': 'total_repair',
      'edit': 'total_edit'
    };

    const statsField = actionToField[action] || `total_${action.replace(/-/g, '_')}`;
    
    await Stats.findOneAndUpdate(
      { user_id: req.user.id },
      { $inc: { [statsField]: 1 }, $set: { last_activity: new Date() } },
      { upsert: true }
    );

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'action' });
  }
};
