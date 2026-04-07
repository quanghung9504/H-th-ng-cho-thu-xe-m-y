const mongoose = require('mongoose');

const depositListingSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  originalDeposit: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  expiredAt: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'OPEN', 'SOLD', 'EXPIRED', 'CANCELLED'], default: 'PENDING' },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  soldAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('DepositListing', depositListingSchema);
