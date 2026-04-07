const express = require('express');
const router = express.Router();
const { 
  getOverview, getRevenueChart, getTopVehicles,
  getAllUsers, updateUserStatus, verifyUserIdentity, deleteUser, updateUser,
  getAllOrders, updateOrderStatus, cancelOrder,
  getAllDepositListings, cancelDepositListing, getPlatformFinancials
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/auth');

/**
 * @swagger
 * /api/admin/stats/overview:
 *   get:
 *     summary: Tổng quan thống kê hệ thống (Doanh thu, Người dùng, Xe)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats/overview', protect, adminOnly, getOverview);

/**
 * @swagger
 * /api/admin/stats/revenue-chart:
 *   get:
 *     summary: Dữ liệu biểu đồ doanh thu theo thời gian
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats/revenue-chart', protect, adminOnly, getRevenueChart);

/**
 * @swagger
 * /api/admin/stats/top-vehicles:
 *   get:
 *     summary: Danh sách các xe được thuê nhiều nhất
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats/top-vehicles', protect, adminOnly, getTopVehicles);

/**
 * @swagger
 * /api/admin/stats/financials:
 *   get:
 *     summary: Thống kê tài chính chi tiết (Phí sàn, Doanh thu thuê xe)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats/financials', protect, adminOnly, getPlatformFinancials);

// User Management
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/status', protect, adminOnly, updateUserStatus);
router.put('/users/:id/verify', protect, adminOnly, verifyUserIdentity);
router.put('/users/:id', protect, adminOnly, updateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Order Management
router.get('/orders', protect, adminOnly, getAllOrders);
router.put('/orders/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/orders/:id/cancel', protect, adminOnly, cancelOrder);

// Marketplace Management
router.get('/marketplace', protect, adminOnly, getAllDepositListings);
router.put('/marketplace/:id/cancel', protect, adminOnly, cancelDepositListing);

module.exports = router;
