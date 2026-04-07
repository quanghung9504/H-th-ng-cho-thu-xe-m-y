const DepositListing = require('../models/DepositListing');
const Order = require('../models/Order');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const NotificationService = require('../services/NotificationService');
const SocketService = require('../services/SocketService');

// @desc    Post a listing to sell deposit
// @route   POST /api/marketplace
// @access  Private
exports.createListing = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Only PENDING or CONFIRMED orders can be sold.' });
    }

    const start = new Date(order.startDate);
    const now = new Date();
    if ((start - now) < (24 * 60 * 60 * 1000)) {
      return res.status(400).json({ success: false, message: 'Cannot sell listing within 24h of start date.' });
    }

    const platformFeeRate = 0.10; // 10% phí sàn
    const platformFee = Math.round(order.depositAmount * platformFeeRate);
    const sellingPrice = order.depositAmount - platformFee;

    const listing = await DepositListing.create({
      sellerId: req.user._id,
      orderId: order._id,
      vehicleId: order.vehicleId,
      originalDeposit: order.depositAmount,
      sellingPrice,
      platformFee,
      expiredAt: new Date(start.getTime() - (24 * 60 * 60 * 1000)),
      status: 'OPEN'
    });

    // Update order status to prevent double use
    order.status = 'LISTED_FOR_SALE';
    await order.save();

    SocketService.notifyNewMarketplaceListing(listing);
    await NotificationService.createAdminNotification('Bài đăng Săn cọc mới', `Có suất cọc mới cho xe ${order.vehicleId?.name || 'mô tô'} vừa được đăng bán.`, 'DEPOSIT_LISTING', 'info', listing._id);

    res.status(201).json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Buy a listing (Transfer ownership)
// @route   POST /api/marketplace/:id/buy
// @access  Private
exports.buyListing = async (req, res) => {
  try {
    const listing = await DepositListing.findById(req.params.id);
    if (!listing || listing.status !== 'OPEN') return res.status(404).json({ success: false, message: 'Listing unavailable' });
    
    // Ngăn chặn tự mua suất của mình
    if (listing.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự mua suất cọc của chính mình!' });
    }

    const buyer = await User.findById(req.user._id);
    if (buyer.walletBalance < listing.sellingPrice) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to buy slot' });
    }

    // 1. Kiểm tra số dư người mua lần cuối
    if (buyer.walletBalance < listing.sellingPrice) {
      return res.status(400).json({ success: false, message: 'Số dư không đủ để mua suất cọc!' });
    }

    // 2. Thực hiện trừ tiền người mua
    const buyerBalanceBefore = buyer.walletBalance;
    buyer.walletBalance -= listing.sellingPrice;
    await buyer.save();
    
    await WalletTransaction.create({
      userId: buyer._id,
      type: 'PAY',
      amount: listing.sellingPrice,
      balanceBefore: buyerBalanceBefore,
      balanceAfter: buyer.walletBalance,
      refType: 'DEPOSIT_LISTING',
      refId: listing._id,
      description: 'Mua suất cọc giá rẻ từ Marketplace',
      status: 'SUCCESS'
    });

    // 3. Thực hiện cộng tiền cho người bán
    const seller = await User.findById(listing.sellerId);
    if (seller) {
      const sellerBalanceBefore = seller.walletBalance;
      seller.walletBalance += listing.sellingPrice;
      await seller.save();
      
      await WalletTransaction.create({
        userId: seller._id,
        type: 'RECEIVE',
        amount: listing.sellingPrice,
        balanceBefore: sellerBalanceBefore,
        balanceAfter: seller.walletBalance,
        refType: 'DEPOSIT_LISTING',
        refId: listing._id,
        description: 'Tiền bán suất cọc thành công',
        status: 'SUCCESS'
      });
    }

    // 4. Chuyển quyền sở hữu đơn hàng
    const order = await Order.findById(listing.orderId);
    if (order) {
      order.originalUserId = order.userId;
      order.userId = buyer._id;
      order.status = 'CONFIRMED'; 
      order.isTransferred = true;
      await order.save();
    }

    // 5. Đóng bài đăng Marketplace
    listing.status = 'SOLD';
    listing.buyerId = buyer._id;
    listing.soldAt = new Date();
    await listing.save();
    
    // 6. Gửi thông báo
    SocketService.notifyMarketplaceSold(listing.sellerId, listing);
    
    await NotificationService.createUserNotification(listing.sellerId, 'Suất cọc đã bán', `Bạn đã nhận được ${listing.sellingPrice.toLocaleString()}đ từ việc sang nhượng suất cọc.`, 'WALLET', 'success');
    await NotificationService.createUserNotification(buyer._id, 'Mua suất cọc thành công', 'Bạn đã sở hữu đơn hàng mới từ marketplace.', 'ORDER', 'success', listing.orderId);
    
    res.status(200).json({ success: true, message: 'Giao dịch thành công. Đơn hàng đã được chuyển sang tài khoản của bạn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Marketplace Listings
// @route   GET /api/marketplace
// @access  Public
exports.getListings = async (req, res) => {
  try {
    const listings = await DepositListing.find({ status: 'OPEN' })
      .populate('vehicleId', 'name images brand model year specs licensePlate pricePerDay')
      .populate('sellerId', 'fullName avatar phone email createdAt')
      .populate('orderId', 'startDate endDate orderCode totalDays');
    res.status(200).json({ success: true, count: listings.length, listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete/Cancel Listing (Penalty applied)
// @route   DELETE /api/marketplace/:id
// @access  Private
exports.deleteListing = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const listing = await DepositListing.findById(req.params.id);
    if (!listing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (listing.status !== 'OPEN') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Only OPEN listings can be cancelled' });
    }

    // Spec: "Gỡ bài đồng nghĩa với việc chấp nhận mất 100% tiền cọc"
    // Since deposit was already paid during Order creation, 
    // we simply cancel the listing, cancel the order, and refund the standard rental price.
    // We DO NOT deduct their wallet again.

    listing.status = 'CANCELLED';
    await listing.save({ session });

    const order = await Order.findById(listing.orderId);
    if (order) {
      order.status = 'CANCELLED';
      await order.save({ session });

      if (order.paymentStatus === 'PAID') {
        const user = await User.findById(req.user._id);
        const refundAmount = order.totalAmount - order.depositAmount; // Refund everything EXCEPT deposit

        if (refundAmount > 0) {
          const balanceBefore = user.walletBalance;
          user.walletBalance += refundAmount;
          await user.save({ session });

          await WalletTransaction.create([{
            userId: user._id,
            type: 'REFUND',
            amount: refundAmount,
            balanceBefore,
            balanceAfter: user.walletBalance,
            refType: 'ORDER',
            refId: order._id,
            description: `Hoàn tiền thuê xe sau khi gỡ bài đăng (Trừ cọc)`,
            status: 'SUCCESS'
          }], { session });
        }
      }

      // Update vehicle status back to AVAILABLE
      await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'AVAILABLE' }).session(session);
    }

    await NotificationService.createAdminNotification('Huỷ bài đăng Săn cọc', `Người dùng vừa gỡ bài đăng Săn cọc cho đơn ${order?.orderCode}.`, 'DEPOSIT_LISTING', 'warning', listing._id);

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Listing cancelled. Deposit penalty applied.' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
