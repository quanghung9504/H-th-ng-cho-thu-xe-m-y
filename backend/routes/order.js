const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly } = require('../middlewares/auth');

router.post('/', protect, orderController.createOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/', protect, adminOnly, orderController.getAllOrders);
router.put('/:id/status', protect, adminOnly, orderController.updateOrderStatus);
router.delete('/:id', protect, orderController.cancelOrder);

module.exports = router;
