const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['DEPOSIT', 'PAY', 'REFUND', 'RECEIVE', 'WITHDRAW'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  refType: { type: String, enum: ['ORDER', 'DEPOSIT_LISTING', 'NONE'], default: 'NONE' },
  refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  description: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
