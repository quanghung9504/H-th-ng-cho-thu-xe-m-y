const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id, isAdmin: false })
      .sort('-createdAt')
      .limit(50);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin notifications
// @route   GET /api/notifications/admin
// @access  Private/Admin
exports.getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ isAdmin: true })
      .sort('-createdAt')
      .limit(100);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    // Check ownership if not admin notification
    if (!notification.isAdmin && notification.userId.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, message: 'Access denied' });
    }

    notification.isRead = true;
    await notification.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
  try {
    const query = req.user.role === 'ADMIN' ? { isAdmin: true } : { userId: req.user._id, isAdmin: false };
    await Notification.updateMany(query, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
