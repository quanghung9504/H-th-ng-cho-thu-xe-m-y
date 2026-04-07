const Category = require('../models/Category');
const Vehicle = require('../models/Vehicle');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Category
// @route   POST /api/fleet/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? req.file.path : '';
    const category = await Category.create({ name, description, image });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Category
// @route   PUT /api/fleet/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.path;
    
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    // Check if any vehicles use this category
    const vehicleCount = await Vehicle.countDocuments({ categoryId: req.params.id });
    if (vehicleCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. It is linked to ${vehicleCount} vehicles.` 
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
