const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Vehicle = require('../models/Vehicle');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/motorbike-rental';

const IMAGES = {
  SH: 'featured_sh_mode_luxury_1775322188322.png',
  EXCITER: 'yamaha_exciter_premium_1775322605719.png',
  VISION: 'honda_vision_elegant_white_1775322698498.png',
  DUCATI: 'ducati_panigale_red_glory_1775322630660.png',
  PANIGALE: 'ducati_panigale_red_glory_1775322630660.png',
  CATEGORY_ICON: 'scooter_category_icon_1775322264314.png'
};

async function migrateImages() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('--- Đang bắt đầu cập nhật Hình ảnh Đẳng cấp Thế giới ---');

    // 1. Update Categories
    const categories = await Category.find();
    for (const cat of categories) {
        cat.image = IMAGES.CATEGORY_ICON;
        await cat.save();
        console.log(`Updated Category: ${cat.name}`);
    }

    // 2. Update Vehicles
    const vehicles = await Vehicle.find();
    for (const v of vehicles) {
       let newImage = 'hero_motorbike_neon_1775322140611.png'; // Global default
       
       const nameUpper = v.name.toUpperCase();
       if (nameUpper.includes('SH')) newImage = IMAGES.SH;
       else if (nameUpper.includes('EXCITER')) newImage = IMAGES.EXCITER;
       else if (nameUpper.includes('VISION')) newImage = IMAGES.VISION;
       else if (nameUpper.includes('DUCATI') || nameUpper.includes('PANIGALE')) newImage = IMAGES.DUCATI;

       v.images = [newImage];
       await v.save();
       console.log(`Updated Vehicle: ${v.name} -> ${newImage}`);
    }

    console.log('--- Cập nhật thành công! Mọi Placeholder đã được xoá bỏ ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi cập nhật:', error);
    process.exit(1);
  }
}

migrateImages();
