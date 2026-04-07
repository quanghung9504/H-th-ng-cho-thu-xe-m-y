const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const { otpTemplate } = require('../utils/emailTemplates');
const crypto = require('crypto');
const NotificationService = require('../services/NotificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });
};

// @desc    Register new user & send OTP
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    
    // Check if email exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash password before putting in temporary storage
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await OtpToken.create({
      email,
      otp,
      userData: { fullName, email, password: hashedPassword, phone }
    });

    // Send OTP via Email Premium
    console.log(`[AUTH-DEBUG] OTP for ${email} is: ${otp}`); // In ra để test cho nhanh
    await sendEmail({ 
      to: email, 
      subject: 'Ride Freedom - Mã OTP xác thực tài khoản', 
      html: otpTemplate(fullName, otp) 
    });

    res.status(200).json({ success: true, message: 'OTP sent to email. Please verify to complete registration.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and Create User
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OtpToken.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Create user
    const newUser = await User.create(otpRecord.userData);
    
    // Delete OTP record
    await OtpToken.deleteOne({ _id: otpRecord._id });

    // Notify Admin about new registration
    try {
      await NotificationService.createAdminNotification(
        '🆕 Thành viên mới gia nhập',
        `${newUser.fullName} (${newUser.email}) vừa đăng ký tài khoản thành công.`,
        'SYSTEM',
        'info'
      );
    } catch (e) {}

    // Generate Token
    const token = generateToken(newUser._id);
    const fullUser = await User.findById(newUser._id).select('-password');
    res.status(201).json({ success: true, token, user: fullUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status === 'LOCKED') return res.status(403).json({ success: false, message: 'Account locked' });
    if (!user.password) {
      console.log(`User has no password (Google user): ${email}`);
      return res.status(400).json({ success: false, message: 'Please login with Google OAuth' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Password mismatch for: ${email}`);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    // Lấy user đầy đủ từ DB (bao gồm walletBalance, avatar, identity...)
    const fullUser = await User.findById(user._id).select('-password');
    console.log(`Login successful for: ${email}`);
    res.status(200).json({ success: true, token, user: fullUser });
  } catch (error) {
    console.error(`Login error for ${req.body.email}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Create reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log(`[AUTH-DEBUG] Reset Link for ${user.email} is: ${resetUrl}`); // In ra để test
    const message = `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

    try {
      await sendEmail({ 
        to: user.email, 
        subject: 'Khôi phục mật khẩu - Ride Freedom', 
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`
      });
      res.status(200).json({ success: true, message: 'Reset link sent to email' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth Boilerplate Handler
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { email, fullName, googleId, avatar } = req.body;
    let user = await User.findOne({ email });
    const isNewUser = !user;
    
    if (!user) {
      user = await User.create({ email, fullName, googleId, avatar, password: null });
    } else {
      if (user.status === 'LOCKED') return res.status(403).json({ success: false, message: 'Account locked' });
    }

    // Notify Admin about new Google user
    if (isNewUser) {
      try {
        await NotificationService.createAdminNotification(
          '🆕 Thành viên mới (Google)',
          `${user.fullName} (${user.email}) vừa đăng ký qua Google.`,
          'SYSTEM',
          'info'
        );
      } catch (e) {}
    }
    
    const token = generateToken(user._id);
    const fullUser = await User.findById(user._id).select('-password');
    res.status(200).json({ success: true, token, user: fullUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
