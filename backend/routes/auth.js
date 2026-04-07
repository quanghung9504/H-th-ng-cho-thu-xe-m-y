const express = require('express');
const router = express.Router();
const { 
  register, verifyOtp, login, googleLogin, 
  forgotPassword, resetPassword 
} = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

module.exports = router;
