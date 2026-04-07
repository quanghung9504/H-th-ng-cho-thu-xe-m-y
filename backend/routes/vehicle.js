const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const { protect, adminOnly } = require('../middlewares/auth');
const { upload } = require('../utils/cloudinary');

// Categories
/**
 * @swagger
 * /api/fleet/categories:
 *   get:
 *     summary: Lấy danh sách danh mục xe
 *     tags: [Categories]
 */
router.get('/categories', getCategories);
router.post('/categories', protect, adminOnly, upload.single('image'), createCategory);

/**
 * @swagger
 * /api/fleet/categories/{id}:
 *   put:
 *     summary: (Admin) Cập nhật danh mục
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 */
router.put('/categories/:id', protect, adminOnly, upload.single('image'), updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);

// Vehicles
/**
 * @swagger
 * /api/fleet/vehicles:
 *   get:
 *     summary: Lấy danh sách xe & Tìm kiếm
 *     tags: [Vehicles]
 */
router.get('/vehicles', getVehicles);

/**
 * @swagger
 * /api/fleet/vehicles/{id}:
 *   get:
 *     summary: Xem chi tiết xe
 *     tags: [Vehicles]
 */
router.get('/vehicles/:id', getVehicle);

/**
 * @swagger
 * /api/fleet/vehicles:
 *   post:
 *     summary: (Admin) Thêm xe mới vào hệ thống
 *     tags: [Admin - Vehicles]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/vehicles', protect, adminOnly, upload.array('images', 5), createVehicle);

/**
 * @swagger
 * /api/fleet/vehicles/{id}:
 *   put:
 *     summary: (Admin) Cập nhật thông tin xe
 *     tags: [Admin - Vehicles]
 *     security: [{ bearerAuth: [] }]
 */
router.put('/vehicles/:id', protect, adminOnly, upload.array('images', 5), updateVehicle);
router.delete('/vehicles/:id', protect, adminOnly, deleteVehicle);

module.exports = router;
