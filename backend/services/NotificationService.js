const Notification = require('../models/Notification');
const SocketService = require('./SocketService');

const MAX_NOTIFICATIONS = 50;

class NotificationService {
  /**
   * Create a notification for a specific user (giới hạn 50)
   */
  static async createUserNotification(userId, title, message, type, status = 'info', refId = null) {
    try {
      const dbNotif = await Notification.create({
        userId,
        title,
        message,
        type,
        status,
        refId,
        isAdmin: false
      });

      // Trim to keep only the latest 50 per user
      const userNotifs = await Notification.find({ userId, isAdmin: false })
        .sort('-createdAt')
        .skip(MAX_NOTIFICATIONS)
        .select('_id');
      if (userNotifs.length > 0) {
        await Notification.deleteMany({ _id: { $in: userNotifs.map(n => n._id) } });
      }

      // Emit real-time socket event
      SocketService.sendNotification({
        userId,
        title,
        message,
        type,
        status,
        refId,
        isAdmin: false,
        createdAt: dbNotif.createdAt
      });

      return dbNotif;
    } catch (error) {
      console.error('Error creating user notification:', error);
    }
  }

  /**
   * Create a notification for all admins (giới hạn 50)
   */
  static async createAdminNotification(title, message, type, status = 'info', refId = null) {
    try {
      const dbNotif = await Notification.create({
        title,
        message,
        type,
        status,
        refId,
        isAdmin: true
      });

      // Trim to keep only the latest 50 admin notifications
      const adminNotifs = await Notification.find({ isAdmin: true })
        .sort('-createdAt')
        .skip(MAX_NOTIFICATIONS)
        .select('_id');
      if (adminNotifs.length > 0) {
        await Notification.deleteMany({ _id: { $in: adminNotifs.map(n => n._id) } });
      }

      // Emit real-time socket event to admin room
      SocketService.sendNotification({
        title,
        message,
        type,
        status,
        refId,
        isAdmin: true,
        createdAt: dbNotif.createdAt
      });

      return dbNotif;
    } catch (error) {
      console.error('Error creating admin notification:', error);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  static async createNotification(userId, title, message, type, refId = null) {
    return this.createUserNotification(userId, title, message, type, 'info', refId);
  }

  /**
   * Legacy method: send only (no DB save)
   */
  static async send({ userId, title, message, type = 'SYSTEM', status = 'info', refId = null }) {
    return this.createUserNotification(userId, title, message, type, status, refId);
  }
}

module.exports = NotificationService;
