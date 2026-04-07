const Order = require('../models/Order');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const NotificationService = require('../services/NotificationService');
const SocketService = require('../services/SocketService');

exports.createOrder = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, paymentMethod, note } = req.body;
    
    // 1. Basic find
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Xe không tồn tại' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
    
    // Calculate New Total = (Price * Days) + Deposit
    const rentalFee = days * (vehicle.pricePerDay || 0);
    const depositAmount = vehicle.depositAmount || 0;
    const totalAmount = rentalFee + depositAmount;

    // 2. Payment from Wallet
    if (paymentMethod === 'WALLET') {
      const user = await User.findById(req.user._id);
      if (user.walletBalance < totalAmount) {
         return res.status(400).json({ success: false, message: 'Số dư ví không đủ để thanh toán (Tiền thuê + Tiền cọc)' });
      }
      user.walletBalance -= totalAmount;
      await user.save();
      
      await WalletTransaction.create({
        userId: user._id,
        type: 'PAY',
        amount: totalAmount,
        balanceBefore: user.walletBalance + totalAmount,
        balanceAfter: user.walletBalance,
        description: `Thanh toán thuê xe ${vehicle.name} (Bao gồm ${depositAmount.toLocaleString()}đ tiền cọc)`,
        status: 'SUCCESS'
      });
    }

    // 3. Create Order
    const order = await Order.create({
      orderCode: `ORD-${Date.now()}`,
      userId: req.user._id,
      vehicleId,
      startDate: start,
      endDate: end,
      totalDays: days,
      rentalPrice: vehicle.pricePerDay,
      depositAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'WALLET' ? 'PAID' : 'UNPAID',
      status: 'PENDING'
    });

    // 4. Notify Admin about new order
    try {
      const user = await User.findById(req.user._id);
      const userName = user?.fullName || 'Khách hàng';
      await NotificationService.createAdminNotification(
        '🛵 Đơn hàng mới vừa được đặt',
        `${userName} vừa đặt xe ${vehicle.name} - Mã đơn: ${order.orderCode}`,
        'ORDER',
        'info',
        order._id
      );
      SocketService.notifyNewOrder(order);
    } catch (e) {}

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('CRITICAL_ORDER_ERROR:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate('vehicleId').sort('-createdAt');
    res.status(200).json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId').populate('vehicleId');
    res.status(200).json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Sync vehicle status
    if (status === 'RENTING') {
      await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'RENTING' });
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'AVAILABLE' });
    }

    // NEW: Handle Deposit Refund when COMPLETED
    if (status === 'COMPLETED' && order.paymentStatus === 'PAID') {
       const user = await User.findById(order.userId);
       if (user && order.depositAmount > 0) {
          user.walletBalance += order.depositAmount;
          await user.save();

          await WalletTransaction.create({
             userId: user._id,
             type: 'REFUND',
             amount: order.depositAmount,
             balanceBefore: user.walletBalance - order.depositAmount,
             balanceAfter: user.walletBalance,
             refType: 'ORDER',
             refId: order._id,
             description: `Hoàn tiền cọc đơn hàng ${order.orderCode} sau khi trả xe`,
             status: 'SUCCESS'
          });
          
          // Notify user
          try {
             NotificationService.send({
                userId: user._id,
                title: 'Hoàn tiền cọc thành công',
                message: `Tiền cọc ${order.depositAmount.toLocaleString()}đ của đơn hàng ${order.orderCode} đã được hoàn về ví.`
             });
          } catch (e) {}
       }
    }

    order.status = status;
    await order.save();
    
    res.status(200).json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only PENDING orders can be cancelled by user.' });
    }

    // NEW Refund logic: Forfeit Deposit, Refund Rental Fee part
    if (order.paymentStatus === 'PAID') {
      const rentalRefund = order.totalAmount - order.depositAmount;
      const user = await User.findById(order.userId);
      
      if (user && rentalRefund > 0) {
         user.walletBalance += rentalRefund;
         await user.save();

         await WalletTransaction.create({
            userId: user._id,
            type: 'REFUND',
            amount: rentalRefund,
            balanceBefore: user.walletBalance - rentalRefund,
            balanceAfter: user.walletBalance,
            refType: 'ORDER',
            refId: order._id,
            description: `Hoàn tiền thuê (trừ cọc) cho đơn huỷ ${order.orderCode}`,
            status: 'SUCCESS'
         });
      }
      
      // Notify about deposit loss
      try {
         NotificationService.send({
            userId: order.userId,
            title: 'Hủy đơn & Mất phí cọc',
            message: `Bạn đã hủy đơn ${order.orderCode}. Theo quy định, số tiền cọc ${order.depositAmount.toLocaleString()}đ sẽ không được hoàn lại.`
         });
      } catch (e) {}
    }

    order.status = 'CANCELLED';
    await order.save();

    // Update vehicle status back to AVAILABLE
    await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'AVAILABLE' });

    res.status(200).json({ success: true, message: 'Đã hủy đơn hàng. Tiền cọc đã bị trừ theo quy định.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
