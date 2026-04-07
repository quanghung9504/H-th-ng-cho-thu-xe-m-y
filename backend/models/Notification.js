const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  isAdmin: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['ORDER', 'WALLET', 'DEPOSIT_LISTING', 'VERIFY', 'SYSTEM'], required: true },
  status: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
