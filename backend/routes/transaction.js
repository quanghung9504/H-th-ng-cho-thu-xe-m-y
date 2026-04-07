const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');

// Order Logic
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');

/**
 * @swagger
 * /api/transactions/orders:
 *   post:
 *     summary: Đặt xe trực tuyến (Trừ tiền ví)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/orders', protect, createOrder);
router.get('/orders/my', protect, getMyOrders);
router.get('/orders', protect, adminOnly, getAllOrders);
router.put('/orders/:id/status', protect, adminOnly, updateOrderStatus);
router.delete('/orders/:id', protect, cancelOrder);

// Wallet Logic
const { getWalletHistory, deposit, paymentCallback, confirmMockDeposit, initiateDeposit, processSimulatedPayment, getTransactionById, withdraw, approveWithdrawal, rejectWithdrawal, getAllTransactions } = require('../controllers/walletController');
router.get('/wallet/history', protect, getWalletHistory);
router.post('/wallet/deposit', protect, deposit);
router.post('/wallet/confirm-mock', protect, confirmMockDeposit);
router.post('/wallet/initiate-mock', protect, initiateDeposit);
router.get('/wallet/:id', getTransactionById);
router.post('/wallet/process-payment/:id', processSimulatedPayment);
router.post('/wallet/withdraw', protect, withdraw);
router.get('/wallet/all', protect, adminOnly, getAllTransactions);
router.put('/wallet/approve-withdraw/:id', protect, adminOnly, approveWithdrawal);
router.put('/wallet/reject-withdraw/:id', protect, adminOnly, rejectWithdrawal);
router.get('/wallet/callback', paymentCallback);

// Marketplace Logic
const { createListing, buyListing, getListings, deleteListing } = require('../controllers/marketplaceController');

/**
 * @swagger
 * /api/transactions/marketplace:
 *   get:
 *     summary: Danh sách suất cọc đang rao bán
 *     tags: [Marketplace]
 */
router.get('/marketplace', getListings);
router.post('/marketplace', protect, createListing);
router.post('/marketplace/:id/buy', protect, buyListing);

/**
 * @swagger
 * /api/transactions/marketplace/{id}:
 *   delete:
 *     summary: Gỡ bài đăng suất cọc (Bị phạt tiền cọc)
 *     tags: [Marketplace]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/marketplace/:id', protect, deleteListing);

module.exports = router;
