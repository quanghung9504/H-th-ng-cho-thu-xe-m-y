const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');

// @desc    Search/Filter Vehicles
// @route   GET /api/vehicles
// @access  Public
exports.getVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;

    const { name, categoryId, brand, minPrice, maxPrice, sort } = req.query;

    // Build match query
    const matchQuery = { status: { $ne: 'HIDDEN' } };
    if (name) matchQuery.name = { $regex: name, $options: 'i' };
    if (categoryId) {
      const mongoose = require('mongoose');
      matchQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (brand) matchQuery.brand = brand;
    if (minPrice || maxPrice) {
      matchQuery.pricePerDay = {};
      if (minPrice) matchQuery.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) matchQuery.pricePerDay.$lte = Number(maxPrice);
    }

    const total = await Vehicle.countDocuments(matchQuery);

    // Sort stage: RENTING first (0), AVAILABLE second (1), others last (2)
    let sortStage;
    if (sort) {
      const field = sort.startsWith('-') ? sort.slice(1) : sort.split(',')[0];
      const order = sort.startsWith('-') ? -1 : 1;
      sortStage = { statusPriority: 1, [field]: order };
    } else {
      sortStage = { statusPriority: 1, createdAt: -1 };
    }

    const vehicles = await Vehicle.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'RENTING'] }, then: 0 },
                { case: { $eq: ['$status', 'AVAILABLE'] }, then: 1 },
              ],
              default: 2
            }
          }
        }
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryId'
        }
      },
      {
        $unwind: { path: '$categoryId', preserveNullAndEmptyArrays: true }
      },
      { $project: { statusPriority: 0 } }
    ]);

    res.status(200).json({ 
      success: true, 
      count: vehicles.length, 
      pagination: { total, page, pages: Math.ceil(total / limit) },
      vehicles 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get Single Vehicle 
// @route   GET /api/vehicles/:id
// @access  Public
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('categoryId', 'name');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    
    // Load reserved dates for calendar
    const orders = await Order.find({
      vehicleId: req.params.id,
      status: { $in: ['PENDING', 'CONFIRMED', 'RENTING'] }
    }).select('startDate endDate');

    res.status(200).json({ success: true, vehicle, reservedDates: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Vehicle
// @route   POST /api/fleet/vehicles
// @access  Private/Admin
exports.createVehicle = async (req, res) => {
  try {
    const vehicleData = { ...req.body };
    if (req.files && req.files.length > 0) {
      vehicleData.images = req.files.map(file => file.path);
    }
    
    // Parse specs if sent as string from FormData
    if (typeof vehicleData.specs === 'string') {
      vehicleData.specs = JSON.parse(vehicleData.specs);
    }

    const vehicle = await Vehicle.create(vehicleData);
    res.status(201).json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Vehicle
// @route   PUT /api/fleet/vehicles/:id
// @access  Private/Admin
exports.updateVehicle = async (req, res) => {
  try {
    const vehicleData = { ...req.body };
    
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      // Nếu gửi từ FormData, có thể muốn append hoặc replace
      // Ở đây mặc định là replace mảng ảnh mới nếu có upload
      vehicleData.images = newImages;
    }

    if (typeof vehicleData.specs === 'string') {
      vehicleData.specs = JSON.parse(vehicleData.specs);
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, vehicleData, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
exports.deleteVehicle = async (req, res) => {
  try {
    // Check for active orders
    const activeOrder = await Order.findOne({
      vehicleId: req.params.id,
      status: { $in: ['PENDING', 'CONFIRMED', 'RENTING'] }
    });

    if (activeOrder) {
      return res.status(400).json({ success: false, message: 'Cannot delete vehicle with active/pending orders.' });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
