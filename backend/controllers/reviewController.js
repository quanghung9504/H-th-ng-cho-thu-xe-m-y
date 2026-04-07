const Review = require('../models/Review');
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { vehicleId, orderId, rating, comment } = req.body;

    // Check if order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or access denied' });
    }

    // Check if order is COMPLETED
    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'You can only review completed orders' });
    }

    // Prevent duplicate review for same order
    const existing = await Review.findOne({ orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá đơn hàng này rồi' });
    }

    // Create review
    const review = await Review.create({
      userId: req.user._id,
      vehicleId,
      orderId,
      rating,
      comment
    });

    // Calculate new average rating for vehicle
    const vehicleReviews = await Review.find({ vehicleId });
    const totalReviews = vehicleReviews.length;
    const avgRating = vehicleReviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews;

    // Update vehicle
    await Vehicle.findByIdAndUpdate(vehicleId, {
      avgRating: avgRating.toFixed(1),
      totalReviews: totalReviews
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá đơn hàng này rồi' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a vehicle
// @route   GET /api/reviews/vehicle/:vehicleId
// @access  Public
exports.getVehicleReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ vehicleId: req.params.vehicleId })
      .populate('userId', 'fullName avatar')
      .sort('-createdAt');
    
    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's reviews (to check which orders already reviewed)
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).select('orderId vehicleId rating createdAt');
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
