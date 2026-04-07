const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const { 
  getNotifications, 
  getAdminNotifications, 
  markAsRead, 
  markAllRead 
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.get('/admin', protect, adminOnly, getAdminNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
