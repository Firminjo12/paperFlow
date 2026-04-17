const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  signature_data: { type: String, required: true }, // base64
  name: { type: String, default: 'Ma signature principale' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Signature', signatureSchema);
