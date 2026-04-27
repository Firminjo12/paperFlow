const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file_name: { type: String, required: true },
  file_size: Number,
  action: { type: String, enum: ['sign', 'merge', 'split', 'compress', 'convert', 'ocr', 'rotate', 'delete-pages', 'extract', 'organize', 'watermark', 'edit', 'page_numbers', 'translate', 'scan', 'repair'], required: true },
  convert_type: { type: String },
  file_url: { type: String },
  signed_at: { type: Date, default: Date.now },
  pages_count: Number,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
