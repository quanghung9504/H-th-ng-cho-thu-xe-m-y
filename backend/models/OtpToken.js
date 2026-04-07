const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  userData: { type: Object, required: true }, // Temporarily hold registration data
  createdAt: { type: Date, default: Date.now, expires: 300 } // Expires in 5 minutes
});

module.exports = mongoose.model('OtpToken', otpTokenSchema);
