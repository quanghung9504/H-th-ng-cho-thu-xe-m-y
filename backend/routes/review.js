const express = require('express');
const router = express.Router();
const { createReview, getVehicleReviews, getMyReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.get('/vehicle/:vehicleId', getVehicleReviews);

module.exports = router;
