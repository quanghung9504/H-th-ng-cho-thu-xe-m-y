const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const NotificationService = require('../services/NotificationService');

// @desc    Get Wallet History
// @route   GET /api/wallet/history
// @access  Private
exports.getWalletHistory = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deposit Money (Link to Payment Gateway)
// @route   POST /api/wallet/deposit
// @access  Private
exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount < 50000) return res.status(400).json({ success: false, message: 'Minimum deposit is 50,000 VNĐ' });

    // Boilerplate for VNPay/Momo redirect
    // const paymentUrl = await PaymentService.createVNPayUrl(amount, req.user._id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Redirecting to payment gateway...',
      url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?placeholder=true' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Payment Callback (Mock)
// @route   GET /api/wallet/callback
// @access  Public
exports.paymentCallback = async (req, res) => {
  // In a real flow, verify checksum here
  const { userId, amount, status } = req.query;
  
  if (status === 'success') {
    const user = await User.findById(userId);
    const balanceBefore = user.walletBalance;
    user.walletBalance += Number(amount);
    await user.save();

    await WalletTransaction.create({
      userId,
      type: 'DEPOSIT',
      amount: Number(amount),
      balanceBefore,
      balanceAfter: user.walletBalance,
      description: 'Nạp tiền vào ví qua VNPay',
      status: 'SUCCESS'
    });

    await NotificationService.createUserNotification(userId, 'Nạp tiền thành công', `Bạn vừa nạp ${Number(amount).toLocaleString()}đ vào ví.`, 'WALLET', 'success');
    await NotificationService.createAdminNotification('Giao dịch nạp tiền', `Người dùng ${user.fullName} vừa nạp ${Number(amount).toLocaleString()}đ vào ví.`, 'WALLET', 'info');
  }
  
  res.redirect('http://localhost:5173/wallet?status=success');
};

// @desc    Confirm Mock Deposit (Simulation)
// @route   POST /api/wallet/confirm-mock
// @access  Private
exports.confirmMockDeposit = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const user = await User.findById(req.user._id);

    const balanceBefore = user.walletBalance;
    user.walletBalance += Number(amount);
    await user.save();

    const transaction = await WalletTransaction.create({
      userId: user._id,
      type: 'DEPOSIT',
      amount: Number(amount),
      balanceBefore,
      balanceAfter: user.walletBalance,
      description: `Nạp tiền vào ví qua ${paymentMethod}`,
      status: 'SUCCESS'
    });

    await NotificationService.createUserNotification(user._id, 'Nạp tiền thành công', `Bạn vừa nạp ${Number(amount).toLocaleString()}đ vào ví qua ${paymentMethod}.`, 'WALLET', 'success');
    await NotificationService.createAdminNotification('Giao dịch nạp tiền', `Người dùng ${user.fullName} vừa nạp ${Number(amount).toLocaleString()}đ via ${paymentMethod}.`, 'WALLET', 'info');

    res.status(200).json({ 
      success: true, 
      user, 
      transaction,
      message: `Đã nạp thành công ${amount.toLocaleString()}đ vào ví!` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initiate Mock Deposit (Create Pending Record)
// @route   POST /api/transactions/wallet/initiate-mock
// @access  Private
exports.initiateDeposit = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    const transaction = await WalletTransaction.create({
      userId: req.user._id,
      type: 'DEPOSIT',
      amount: Number(amount),
      balanceBefore: req.user.walletBalance,
      balanceAfter: req.user.walletBalance,
      description: `Nạp tiền qua ${paymentMethod}`,
      status: 'PENDING'
    });

    res.status(200).json({ success: true, transactionId: transaction._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process Simulated Payment (Webhook Mock)
// @route   POST /api/transactions/wallet/process-payment/:id
// @access  Public
exports.processSimulatedPayment = async (req, res) => {
  try {
    const WalletTransaction = require('../models/WalletTransaction');
    const User = require('../models/User');
    const transaction = await WalletTransaction.findById(req.params.id);
    
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status === 'SUCCESS') return res.status(400).json({ success: false, message: 'Transaction already processed' });

    const user = await User.findById(transaction.userId);
    const balanceBefore = user.walletBalance;
    user.walletBalance += transaction.amount;
    await user.save();

    transaction.status = 'SUCCESS';
    transaction.balanceAfter = user.walletBalance;
    await transaction.save();

    await NotificationService.createUserNotification(user._id, 'Nạp tiền thành công', `Giao dịch ${transaction.amount.toLocaleString()}đ đã được xử lý thành công.`, 'WALLET', 'success');
    await NotificationService.createAdminNotification('Giao dịch nạp tiền', `Giao dịch nạp tiền ${transaction.amount.toLocaleString()}đ của ${user.fullName} đã hoàn tất.`, 'WALLET', 'info');

    // Emit Socket.io success event to user
    const { getIO } = require('../services/SocketService');
    const io = getIO();
    io.emit(`payment_success_${user._id}`, {
      message: `Đã nhận thành công ${transaction.amount.toLocaleString()}đ!`,
      amount: transaction.amount,
      balance: user.walletBalance
    });

    res.status(200).json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get Transaction By ID (for simulation)
// @route   GET /api/transactions/wallet/:id
// @access  Public
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await WalletTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Withdraw Money (Request)
// @route   POST /api/transactions/wallet/withdraw
// @access  Private
exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    if (amount < 50000) return res.status(400).json({ success: false, message: 'Minimum withdrawal is 50,000đ' });
    if (user.walletBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const balanceBefore = user.walletBalance;
    user.walletBalance -= Number(amount);
    await user.save();

    const transaction = await WalletTransaction.create({
      userId: user._id,
      type: 'WITHDRAW',
      amount: Number(amount),
      balanceBefore,
      balanceAfter: user.walletBalance,
      description: 'Yêu cầu rút tiền về ngân hàng',
      status: 'PENDING'
    });

    await NotificationService.createUserNotification(user._id, 'Yêu cầu rút tiền', `Yêu cầu rút ${amount.toLocaleString()}đ của bạn đang chờ duyệt.`, 'WALLET', 'info');
    await NotificationService.createAdminNotification('Yêu cầu rút tiền mới', `Người dùng ${user.fullName} vừa yêu cầu rút ${amount.toLocaleString()}đ.`, 'WALLET', 'warning');

    res.status(200).json({ success: true, user, transaction, message: 'Yêu cầu rút tiền đã được gửi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve Withdrawal
// @route   PUT /api/transactions/wallet/approve-withdraw/:id
// @access  Private/Admin
exports.approveWithdrawal = async (req, res) => {
  try {
    const transaction = await WalletTransaction.findById(req.params.id);
    if (!transaction || transaction.type !== 'WITHDRAW') return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Transaction already processed' });

    transaction.status = 'SUCCESS';
    await transaction.save();

    await NotificationService.createUserNotification(transaction.userId, 'Rút tiền thành công', `Yêu cầu rút ${transaction.amount.toLocaleString()}đ của bạn đã được phê duyệt và chuyển khoản.`, 'WALLET', 'success');

    res.status(200).json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject Withdrawal
// @route   PUT /api/transactions/wallet/reject-withdraw/:id
// @access  Private/Admin
exports.rejectWithdrawal = async (req, res) => {
  try {
    const transaction = await WalletTransaction.findById(req.params.id);
    if (!transaction || transaction.type !== 'WITHDRAW') return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Transaction already processed' });

    // Hoàn tiền lại ví
    const user = await User.findById(transaction.userId);
    const balanceBefore = user.walletBalance;
    user.walletBalance += transaction.amount;
    await user.save();

    transaction.status = 'FAILED';
    transaction.balanceAfter = user.walletBalance;
    transaction.description += ' (Bị từ chối - Đã hoàn tiền)';
    await transaction.save();

    await NotificationService.createUserNotification(transaction.userId, 'Rút tiền thất bại', `Yêu cầu rút ${transaction.amount.toLocaleString()}đ của bạn bị từ chối. Tiền đã được hoàn lại ví.`, 'WALLET', 'error');

    res.status(200).json({ success: true, message: 'Withdrawal rejected and refunded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Transactions (Admin)
// @route   GET /api/transactions/wallet/all
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find().populate('userId', 'fullName email phone').sort('-createdAt');
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
