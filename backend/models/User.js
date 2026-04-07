const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: null }, // Null for Google OAuth
  phone: { type: String },
  avatar: { type: String, default: 'https://res.cloudinary.com/demo/image/upload/v1564614275/default-avatar.png' },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  status: { type: String, enum: ['ACTIVE', 'LOCKED'], default: 'ACTIVE' },
  walletBalance: { type: Number, default: 0 },
  googleId: { type: String, default: null },
  identity: {
    cccdFront: { type: String, default: null },
    cccdBack: { type: String, default: null },
    drivingLicense: { type: String, default: null },
    verifyStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'UNVERIFIED'], default: 'UNVERIFIED' },
    rejectReason: { type: String, default: null }
  },
  sellerRating: { type: Number, default: 5.0 },
  totalSales: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
