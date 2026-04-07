const express = require('express');
const router = express.Router();
const { 
  getProfile, updateProfile, changePassword, 
  verifyIdentity 
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { upload } = require('../utils/cloudinary');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/verify-identity', protect, upload.fields([
  { name: 'cccdFront', maxCount: 1 },
  { name: 'drivingLicense', maxCount: 1 }
]), verifyIdentity);

module.exports = router;
