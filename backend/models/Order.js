const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  rentalPrice: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'RENTING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
  paymentStatus: { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
  paymentMethod: { type: String, enum: ['WALLET', 'VNPAY', 'MOMO'], required: true },
  note: { type: String },
  originalUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isTransferred: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
