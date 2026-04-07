const Order = require('../models/Order');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const DepositListing = require('../models/DepositListing');
const WalletTransaction = require('../models/WalletTransaction');
const { sendEmail } = require('../utils/email');

// @desc    Get Dashboard Overview with Growth KPIs
// @route   GET /api/admin/stats/overview
// @access  Private/Admin
exports.getOverview = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

    // 1. Current Month Net Revenue (Rental + Forfeited + Platform Fees)
    const [monthlyRental, monthlyForfeited, monthlyFees] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'COMPLETED', updatedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$depositAmount'] } } } }
      ]),
      Order.aggregate([
        { $match: { status: 'CANCELLED', paymentStatus: 'PAID', updatedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$depositAmount' } } }
      ]),
      DepositListing.aggregate([
        { $match: { status: 'SOLD', updatedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } }
      ])
    ]);

    const totalNetMonth = (monthlyRental[0]?.total || 0) + (monthlyForfeited[0]?.total || 0) + (monthlyFees[0]?.total || 0);

    const usersMonth = await User.countDocuments({ role: 'USER', createdAt: { $gte: startOfMonth } });
    
    // 2. Previous Month Net Revenue (for Growth calculation)
    const [prevRental, prevForfeited, prevFees] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'COMPLETED', updatedAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$depositAmount'] } } } }
      ]),
      Order.aggregate([
        { $match: { status: 'CANCELLED', paymentStatus: 'PAID', updatedAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
        { $group: { _id: null, total: { $sum: '$depositAmount' } } }
      ]),
      DepositListing.aggregate([
        { $match: { status: 'SOLD', updatedAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } }
      ])
    ]);

    const totalNetPrevMonth = (prevRental[0]?.total || 0) + (prevForfeited[0]?.total || 0) + (prevFees[0]?.total || 0);

    const usersPrevMonth = await User.countDocuments({ 
      role: 'USER', 
      createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } 
    });

    // Calculate Growth %
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revGrowth = calculateGrowth(totalNetMonth, totalNetPrevMonth);
    const userGrowth = calculateGrowth(usersMonth, usersPrevMonth);

    const newOrdersToday = await Order.countDocuments({ status: 'PENDING', createdAt: { $gte: startOfToday } });
    const pendingOrders = await Order.countDocuments({ status: 'PENDING' });
    const confirmedOrders = await Order.countDocuments({ status: 'CONFIRMED' });
    const rentingVehicles = await Vehicle.countDocuments({ status: 'RENTING' });
    const pendingKYC = await User.countDocuments({ 'identity.verifyStatus': 'PENDING' });
    const pendingMarketplace = await DepositListing.countDocuments({ status: 'PENDING' });
    const pendingWithdrawals = await WalletTransaction.countDocuments({ type: 'WITHDRAW', status: 'PENDING' });

    res.status(200).json({
      success: true,
      stats: {
        totalRevenueMonth: totalNetMonth,
        revenueGrowth: revGrowth,
        newOrdersToday,
        newUsersMonth: usersMonth,
        userGrowth,
        rentingVehicles,
        pendingOrders,
        pendingKYC,
        confirmedOrders,
        pendingMarketplace,
        pendingWithdrawals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Revenue Chart Data (Last 7 Days with Gap Filling)
// @route   GET /api/admin/stats/revenue-chart
// @access  Private/Admin
exports.getRevenueChart = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const days = [];
    let startOfPeriod;
    let endOfPeriod = endDate ? new Date(endDate) : new Date();
    endOfPeriod.setHours(23, 59, 59, 999);

    if (startDate) {
      startOfPeriod = new Date(startDate);
      startOfPeriod.setHours(0, 0, 0, 0);
      
      let curr = new Date(startOfPeriod);
      while (curr <= endOfPeriod) {
        days.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
      }
      startOfPeriod = new Date();
      startOfPeriod.setDate(startOfPeriod.getDate() - 6);
      startOfPeriod.setHours(0, 0, 0, 0);
    }

    const dateMatch = { updatedAt: { $gte: startOfPeriod, $lte: endOfPeriod } };

    // 1. Rental Revenue (COMPLETED orders, subtracting deposit)
    const rentalRaw = await Order.aggregate([
      { $match: { status: 'COMPLETED', ...dateMatch } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, 
          total: { $sum: { $subtract: ["$totalAmount", "$depositAmount"] } } 
      } }
    ]);

    // 2. Platform Fees (SOLD marketplace listings)
    const feesRaw = await DepositListing.aggregate([
      { $match: { status: 'SOLD', ...dateMatch } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, 
          total: { $sum: "$platformFee" } 
      } }
    ]);

    // 3. Forfeited Deposits (CANCELLED + PAID orders)
    const forfeitedRaw = await Order.aggregate([
      { $match: { status: 'CANCELLED', paymentStatus: 'PAID', ...dateMatch } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, 
          total: { $sum: "$depositAmount" } 
      } }
    ]);

    const revenueData = days.map(day => {
      const r = rentalRaw.find(d => d._id === day);
      const f = feesRaw.find(d => d._id === day);
      const lost = forfeitedRaw.find(d => d._id === day);
      return {
        name: day.split('-').slice(1).join('/'),
        rental: r ? r.total : 0,
        fees: f ? f.total : 0,
        forfeited: lost ? lost.total : 0
      };
    });

    res.status(200).json({ success: true, revenueData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Users for Management
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, verifyStatus, role } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (role) query.role = role;
    if (verifyStatus) query['identity.verifyStatus'] = verifyStatus;

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update User Status (Lock/Unlock)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Check if user has active orders
    const activeOrders = await Order.countDocuments({ userId: user._id, status: { $in: ['PENDING', 'CONFIRMED', 'RENTING'] } });
    if (activeOrders > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete user with active orders' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update User Info
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { fullName, phone, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    
    await user.save();
    
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { kycResultTemplate, orderConfirmationTemplate } = require('../utils/emailTemplates');
const SocketService = require('../services/SocketService');

// @desc    Verify User Identity (CCCD Approval)
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
exports.verifyUserIdentity = async (req, res) => {
  try {
    const { status, reason } = req.body; // status: VERIFIED or REJECTED
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.identity.verifyStatus = status;
    if (reason) user.identity.rejectReason = reason;
    await user.save();

    // In-app Notification
    try {
      const NotificationService = require('../services/NotificationService');
      if (status === 'VERIFIED') {
        await NotificationService.createUserNotification(
          user._id,
          '🎉 Xác thực danh tính thành công!',
          'Hồ sơ định danh của bạn đã được Admin xác minh. Bạn có thể đặt xe ngay bây giờ!',
          'VERIFY', 'success'
        );
      } else if (status === 'REJECTED') {
        await NotificationService.createUserNotification(
          user._id,
          '❌ Hồ sơ xác thực bị từ chối',
          `Hồ sơ định danh của bạn chưa được chấp thuận. Lý do: ${reason || 'Ảnh không rõ ràng hoặc không hợp lệ'}. Vui lòng nộp lại.`,
          'VERIFY', 'error'
        );
      }
    } catch (e) {}

    // Email thông báo Premium
    const subject = status === 'VERIFIED' ? 'Chúc mừng! Tài khoản của bạn đã được xác minh' : 'Yêu cầu xác minh tài khoản bị từ chối';
    
    await sendEmail({
      to: user.email,
      subject,
      html: kycResultTemplate(user.fullName, status, reason)
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Orders for Admin
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .populate('userId', 'fullName email phone')
      .populate('vehicleId', 'name brand images')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Order Status (Confirm Rent/Return)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('userId')
      .populate('vehicleId', 'name brand images');
      
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;

    if (status === 'RENTING') {
      await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'RENTING' });
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'AVAILABLE' });
    }

    // NEW: Handle Deposit Refund when COMPLETED
    if (status === 'COMPLETED' && order.paymentStatus === 'PAID') {
       const user = await User.findById(order.userId._id);
       if (user && order.depositAmount > 0) {
          const balanceBefore = user.walletBalance;
          user.walletBalance += order.depositAmount;
          await user.save();

          await WalletTransaction.create({
             userId: user._id,
             type: 'REFUND',
             amount: order.depositAmount,
             balanceBefore,
             balanceAfter: user.walletBalance,
             refType: 'ORDER',
             refId: order._id,
             description: `Hoàn tiền cọc đơn hàng ${order.orderCode} (Admin duyệt hoàn thành)`,
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

    await order.save();

    // Thông báo cho User theo từng trạng thái
    try {
      const NotificationService = require('../services/NotificationService');
      const userId = order.userId._id || order.userId;
      const vehicleName = order.vehicleId?.name || 'xe';

      if (status === 'CONFIRMED') {
        await NotificationService.createUserNotification(
          userId,
          '✅ Đơn hàng đã được duyệt!',
          `Đơn hàng ${order.orderCode} của bạn đã được xác nhận. Vui lòng đến điểm nhận xe đúng hẹn.`,
          'ORDER', 'success', order._id
        );
        SocketService.notifyOrderConfirmed(userId, order);

        // Email xác nhận
        await sendEmail({
          to: order.userId.email,
          subject: `Xác nhận Đơn hàng ${order.orderCode} - Ride Freedom`,
          html: orderConfirmationTemplate(order.userId.fullName, {
            orderCode: order.orderCode,
            vehicleName,
            startDate: order.startDate,
            endDate: order.endDate,
            totalAmount: order.totalAmount
          })
        });
      }

      if (status === 'RENTING') {
        await NotificationService.createUserNotification(
          userId,
          '🛵 Xe đã được bàn giao!',
          `${vehicleName} cho đơn hàng ${order.orderCode} đã được bàn giao. Chúc bạn có hành trình tuyệt vời!`,
          'ORDER', 'success', order._id
        );
      }

      if (status === 'COMPLETED') {
        await NotificationService.createUserNotification(
          userId,
          '🎉 Cảm ơn bạn đã tin tưởng Ride Freedom!',
          `Đơn hàng ${order.orderCode} đã hoàn tất. Tiền cọc đã được hoàn về ví. Hẹn gặp lại bạn trong hành trình tiếp theo nhé!`,
          'ORDER', 'success', order._id
        );
      }
    } catch (e) { console.error('[Notification] Error:', e.message); }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel Order with Refund
// @route   PUT /api/admin/orders/:id/cancel
// @access  Private/Admin
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id).populate('userId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed order' });
    }

    // Nếu đã thanh toán bằng ví, thực hiện hoàn tiền (TRỪ TIỀN CỌC)
    if (order.paymentStatus === 'PAID') {
      const rentalRefund = order.totalAmount - order.depositAmount;
      const user = await User.findById(order.userId._id);
      
      if (user && rentalRefund > 0) {
         const balanceBefore = user.walletBalance;
         user.walletBalance += rentalRefund;
         await user.save();

         // Lưu giao dịch hoàn tiền thuê
         await WalletTransaction.create({
           userId: user._id,
           type: 'REFUND',
           amount: rentalRefund,
           balanceBefore,
           balanceAfter: user.walletBalance,
           refType: 'ORDER',
           refId: order._id,
           description: `Hoàn tiền thuê (trừ cọc) cho đơn huỷ ${order.orderCode} (Admin hủy)`,
           status: 'SUCCESS'
         });
      }

      // Thông báo mất cọc
      try {
         NotificationService.send({
            userId: order.userId._id,
            title: 'Đơn hàng bị hủy & Mất phí cọc',
            message: `Đơn hàng ${order.orderCode} của bạn đã bị hủy bởi Admin. Theo quy định, số tiền cọc ${order.depositAmount.toLocaleString()}đ sẽ không được hoàn lại.`
         });
      } catch (e) {}
    }

    order.status = 'CANCELLED';
    await order.save();

    // Cập nhật lại xe về trạng thái trống
    await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'AVAILABLE' });

    // Gửi thông báo huỷ đơn tổng quát
    const subject = `Đơn hàng ${order.orderCode} đã bị huỷ bởi Admin`;
    const html = `<h3>Chào ${order.userId.fullName},</h3><p>Đơn hàng <b>${order.orderCode}</b> của bạn đã được Admin huỷ.</p><p><b>Lý do:</b> ${reason}</p><p>Tiền thuê xe đã được hoàn vào ví (nếu có), tiền cọc bị giữ lại theo quy định.</p>`;
    await sendEmail({ to: order.userId.email, subject, html });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Deposit Listings for Admin
// @route   GET /api/admin/marketplace
// @access  Private/Admin
exports.getAllDepositListings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const listings = await DepositListing.find(query)
      .populate('sellerId', 'fullName email')
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel/Remove Marketplace Listing
// @route   PUT /api/admin/marketplace/:id/cancel
// @access  Private/Admin
exports.cancelDepositListing = async (req, res) => {
  try {
    const { reason } = req.body;
    const listing = await DepositListing.findById(req.params.id).populate('sellerId');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    listing.status = 'CANCELLED';
    await listing.save();

    // Gửi thông báo lý do gỡ bài
    const subject = 'Thông báo: Bài đăng săn cọc của bạn đã bị gỡ';
    const html = `<h3>Chào ${listing.sellerId.fullName},</h3><p>Bài đăng chuyển nhượng cọc cho đơn hàng <b>${listing.orderId}</b> đã bị gỡ bởi Admin.</p><p><b>Lý do:</b> ${reason}</p>`;
    await sendEmail({ to: listing.sellerId.email, subject, html });

    res.status(200).json({ success: true, message: 'Listing cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Full Financial Statistics
// @route   GET /api/admin/stats/financials
// @access  Private/Admin
exports.getPlatformFinancials = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    
    if (startDate || endDate) {
      dateQuery.updatedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateQuery.updatedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.updatedAt.$lte = end;
      }
    }

    // 1. Doanh thu từ tiền thuê xe (Chỉ lấy phần tiền thuê, trừ tiền cọc)
    const rentalRevenue = await Order.aggregate([
      { $match: { status: 'COMPLETED', ...dateQuery } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$depositAmount'] } } } }
    ]);

    // 2. Doanh thu từ tiền cọc bị mất (Đơn bị hủy nhưng đã thanh toán)
    const forfeitedDeposits = await Order.aggregate([
      { $match: { status: 'CANCELLED', paymentStatus: 'PAID', ...dateQuery } },
      { $group: { _id: null, total: { $sum: '$depositAmount' } } }
    ]);

    // 3. Doanh thu từ phí sàn chuyển nhượng (Platform Fee Marketplace)
    const platformFees = await DepositListing.aggregate([
      { $match: { status: 'SOLD', ...dateQuery } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } }
    ]);

    const rentalTotal = rentalRevenue[0]?.total || 0;
    const forfeitTotal = forfeitedDeposits[0]?.total || 0;
    const feesTotal = platformFees[0]?.total || 0;

    res.status(200).json({
      success: true,
      rentalRevenue: rentalTotal,
      platformFees: feesTotal,
      forfeitedDeposits: forfeitTotal,
      totalCombined: rentalTotal + forfeitTotal + feesTotal,
      orderStats: await Order.aggregate([
        { $match: dateQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Removed duplicate exports.getRevenueChart

// @desc    Top Rented Vehicles
// @route   GET /api/admin/stats/top-vehicles
// @access  Private/Admin
exports.getTopVehicles = async (req, res) => {
  try {
    const topVehicles = await Order.aggregate([
      { $group: { _id: "$vehicleId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "vehicles",
          localField: "_id",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" }
    ]);

    res.status(200).json({ success: true, topVehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
