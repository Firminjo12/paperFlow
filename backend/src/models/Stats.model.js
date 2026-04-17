const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  total_signed: { type: Number, default: 0 },
  total_merged: { type: Number, default: 0 },
  total_split: { type: Number, default: 0 },
  total_compressed: { type: Number, default: 0 },
  total_converted: { type: Number, default: 0 },
  total_ocr: { type: Number, default: 0 },
  total_rotate: { type: Number, default: 0 },
  total_page_numbers: { type: Number, default: 0 },
  total_watermark: { type: Number, default: 0 },
  total_translate: { type: Number, default: 0 },
  total_scan: { type: Number, default: 0 },
  total_repair: { type: Number, default: 0 },
  total_edit: { type: Number, default: 0 },
  total_delete_pages: { type: Number, default: 0 },
  total_extract: { type: Number, default: 0 },
  total_organize: { type: Number, default: 0 },
  last_activity: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stats', statsSchema);
