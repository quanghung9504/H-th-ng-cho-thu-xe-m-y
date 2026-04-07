const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/mailer');
const NotificationService = require('../services/NotificationService');

// @desc    Get User Profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    let user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (req.file) {
      user.avatar = req.file.path;
    } else if (req.body.avatar) {
      user.avatar = req.body.avatar; 
    }

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'OAuth user cannot change password' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const kycService = require('../services/kycService');
const SocketService = require('../services/SocketService');

// @desc    Upload Identity Documents (CCCD/GPLX)
// @route   POST /api/users/verify-identity
// @access  Private
exports.verifyIdentity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const cccdFront = req.files['cccdFront'] ? req.files['cccdFront'][0].path : null;
    const drivingLicense = req.files['drivingLicense'] ? req.files['drivingLicense'][0].path : null;

    if (!cccdFront || !drivingLicense) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ cả 2 mặt ảnh!' });
    }

    // 1. Lưu tạm trạng thái PENDING và ảnh lên Cloudinary
    user.identity = {
      cccdFront,
      drivingLicense,
      verifyStatus: 'PENDING',
      rejectReason: null
    };
    await user.save();

    // Notify Admin about new KYC submission
    try {
      await NotificationService.createAdminNotification(
        '📌 Yêu cầu xác thực KYC mới',
        `${user.fullName} vừa nộp hồ sơ định danh và đang chờ Admin phê duyệt.`,
        'VERIFY',
        'warning',
        user._id
      );
    } catch (e) {}

    // Phản hồi ngay cho người dùng để không phải chờ lâu
    res.status(200).json({ 
      success: true, 
      user, 
      message: 'Đã nhận hồ sơ. Hệ thống AI đang thực hiện phân tích và xác thực tự động...' 
    });

    // 2. Chạy AI Phân tích ngầm (Background Task) để không chặn Request
    setTimeout(async () => {
      try {
        const [frontRes, licenseRes] = await Promise.all([
          kycService.analyzeIdentity(cccdFront),
          kycService.analyzeIdentity(drivingLicense)
        ]);

        console.log(`[Auto-KYC] Result for ${user.fullName}:`, { frontRes, licenseRes });

        if (frontRes.isValid && licenseRes.isValid) {
          user.identity.verifyStatus = 'VERIFIED';
          user.identity.rejectReason = `Xác thực tự động thành công: ${frontRes.type} & ${licenseRes.type}`;
        } else {
          user.identity.verifyStatus = 'REJECTED';
          user.identity.rejectReason = !frontRes.isValid ? frontRes.reason : licenseRes.reason;
        }

        await user.save();

        // 3. Bắn thông báo Real-time cho người dùng
        SocketService.sendNotification({
          userId: user._id,
          title: 'Kết quả xác thực AI',
          message: user.identity.verifyStatus === 'VERIFIED' 
            ? 'Tuyệt vời! Hồ sơ của bạn đã được AI duyệt tự động.' 
            : `Hồ sơ bị từ chối: ${user.identity.rejectReason}`,
          status: user.identity.verifyStatus === 'VERIFIED' ? 'success' : 'error',
          type: 'SYSTEM'
        });
        
      } catch (aiError) {
        console.error('[Auto-KYC] AI Processing Error:', aiError);
      }
    }, 500);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
