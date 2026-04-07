const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');
const Vehicle = require('./models/Vehicle');
const Order = require('./models/Order');
const DepositListing = require('./models/DepositListing');
const Review = require('./models/Review');
const WalletTransaction = require('./models/WalletTransaction');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for comprehensive seeding...');

    // 1. Clear existing dynamic data
    await Order.deleteMany({});
    await DepositListing.deleteMany({});
    await Review.deleteMany({});
    await WalletTransaction.deleteMany({});
    
    // Reset User states but keep them
    await User.updateMany({ role: 'USER' }, { walletBalance: 1000000, 'identity.verifyStatus': 'VERIFIED' });

    // Ensure users exist
    const user1 = await User.findOneAndUpdate(
      { email: 'user1@test.com' },
      { fullName: 'Nguyễn Văn A', role: 'USER', 'identity.verifyStatus': 'VERIFIED' },
      { upsert: true, new: true }
    );
    const user2 = await User.findOneAndUpdate(
      { email: 'user2@test.com' },
      { fullName: 'Trần Thị B', role: 'USER', 'identity.verifyStatus': 'VERIFIED' },
      { upsert: true, new: true }
    );

    // 2. Create Categories with Real Images
    const cat1 = await Category.findOneAndUpdate(
      { name: 'Xe Tay Ga' }, 
      { 
        name: 'Xe Tay Ga', 
        description: 'Các dòng xe tay ga hiện đại, sang trọng và tiện nghi.',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400'
      }, 
      { upsert: true, new: true }
    );
    const cat2 = await Category.findOneAndUpdate(
      { name: 'Xe Số' }, 
      { 
        name: 'Xe Số', 
        description: 'Các dòng xe số bền bỉ, mạnh mẽ trên mọi cung đường.',
        image: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=400'
      }, 
      { upsert: true, new: true }
    );

    // 3. Create Vehicles with Real Images
    const vehiclesData = [
      { name: 'Honda Air Blade 2023', categoryId: cat1._id, brand: 'Honda', model: 'Air Blade', year: 2023, licensePlate: '29A1-11111', pricePerDay: 150000, depositAmount: 2000000, description: 'Xe mới 100%, tiết kiệm xăng, cốp rộng.', status: 'AVAILABLE', images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800'], specs: { engine: '125cc', year: 2023 } },
      { name: 'Yamaha Exciter 155', categoryId: cat2._id, brand: 'Yamaha', model: 'Exciter', year: 2022, licensePlate: '59B1-22222', pricePerDay: 180000, depositAmount: 3000000, description: 'Xe côn tay mạnh mẽ, bứt tốc nhanh.', status: 'AVAILABLE', images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'], specs: { engine: '155cc', year: 2022 } },
      { name: 'Honda Vision 2022', categoryId: cat1._id, brand: 'Honda', model: 'Vision', year: 2022, licensePlate: '30K1-33333', pricePerDay: 120000, depositAmount: 1500000, description: 'Dòng xe quốc dân, nhẹ nhàng, thanh lịch.', status: 'AVAILABLE', images: ['https://images.unsplash.com/photo-1622185135505-2d795003994a?auto=format&fit=crop&q=80&w=800'], specs: { engine: '110cc', year: 2022 } },
      { name: 'Honda Winner X 2023', categoryId: cat2._id, brand: 'Honda', model: 'Winner X', year: 2023, licensePlate: '29H1-44444', pricePerDay: 170000, depositAmount: 2500000, description: 'Thiết kế thể thao, phanh ABS an toàn.', status: 'AVAILABLE', images: ['https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&q=80&w=800'], specs: { engine: '150cc', year: 2023 } },
      { name: 'Suzuki Raider R150', categoryId: cat2._id, brand: 'Suzuki', model: 'Raider', year: 2022, licensePlate: '59B2-66666', pricePerDay: 190000, depositAmount: 3500000, description: 'Vua dòng xe hyper-underbone.', status: 'AVAILABLE', images: ['https://images.unsplash.com/photo-1558981424-86a2f127d897?auto=format&fit=crop&q=80&w=800'], specs: { engine: '150cc', year: 2022 } }
    ];

    for (const v of vehiclesData) {
      await Vehicle.findOneAndUpdate({ licensePlate: v.licensePlate }, v, { upsert: true });
    }
    const vehicles = await Vehicle.find({});

    console.log('--- Database Cleared & Base Data Ready ---');

    // 4. Create Orders across last 7 days for Chart Testing
    const now = new Date();
    const orders = [
      {
        orderCode: 'ORD-REF-01', userId: user1._id, vehicleId: vehicles[0]._id,
        startDate: new Date(now), endDate: new Date(now.getTime() + 86400000 * 2),
        totalDays: 2, rentalPrice: 150000, depositAmount: 2000000, totalAmount: 2300000,
        status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'WALLET', updatedAt: new Date(now)
      },
      {
        orderCode: 'ORD-REF-02', userId: user2._id, vehicleId: vehicles[1]._id,
        startDate: new Date(now), endDate: new Date(now.getTime() + 86400000),
        totalDays: 1, rentalPrice: 180000, depositAmount: 3000000, totalAmount: 3180000,
        status: 'PENDING', paymentStatus: 'UNPAID', paymentMethod: 'WALLET', updatedAt: new Date(now)
      },
      {
        orderCode: 'ORD-REF-03', userId: user1._id, vehicleId: vehicles[2]._id,
        startDate: new Date(now.getTime() - 86400000), endDate: new Date(now.getTime() + 86400000 * 2),
        totalDays: 3, rentalPrice: 120000, depositAmount: 1500000, totalAmount: 1860000,
        status: 'CANCELLED', paymentStatus: 'PAID', paymentMethod: 'WALLET', updatedAt: new Date(now.getTime() - 86400000)
      },
      {
        orderCode: 'ORD-REF-04', userId: user2._id, vehicleId: vehicles[3]._id,
        startDate: new Date(now.getTime() - 86400000 * 3), endDate: new Date(now.getTime() - 86400000),
        totalDays: 2, rentalPrice: 170000, depositAmount: 2500000, totalAmount: 2840000,
        status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'WALLET', updatedAt: new Date(now.getTime() - 86400000 * 2)
      },
      {
        orderCode: 'ORD-REF-05', userId: user1._id, vehicleId: vehicles[4]._id,
        startDate: new Date(now.getTime() - 86400000 * 4), endDate: new Date(now.getTime() + 86400000),
        totalDays: 5, rentalPrice: 110000, depositAmount: 1500000, totalAmount: 2050000,
        status: 'CONFIRMED', paymentStatus: 'PAID', paymentMethod: 'WALLET', updatedAt: new Date(now.getTime() - 86400000 * 3)
      }
    ];

    for (const o of orders) {
      const order = new Order(o);
      await order.save();
      await Order.findByIdAndUpdate(order._id, { updatedAt: o.updatedAt });
    }

    // 5. Marketplace Listings (SOLD and PENDING)
    const soldListing = new DepositListing({
      sellerId: user1._id, orderId: (await Order.findOne({orderCode: 'ORD-REF-04'}))._id, 
      vehicleId: vehicles[3]._id, originalDeposit: 2500000, sellingPrice: 2000000, 
      platformFee: 150000, status: 'SOLD', expiredAt: new Date(now.getTime() + 86400000), updatedAt: new Date(now.getTime() - 86400000)
    });
    await soldListing.save();
    await DepositListing.findByIdAndUpdate(soldListing._id, { updatedAt: now.getTime() - 86400000 });

    // 6. Ensure some PENDING items for "Urgent Tasks"
    await User.findOneAndUpdate(
      { email: 'pending_user@test.com' },
      { fullName: 'User Chờ Duyệt', password: await bcrypt.hash('user123', 10), role: 'USER', 'identity.verifyStatus': 'PENDING', 'identity.frontImage': 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' },
      { upsert: true }
    );

    const openListing = new DepositListing({
      sellerId: user2._id, orderId: (await Order.findOne({orderCode: 'ORD-REF-05'}))._id, 
      vehicleId: vehicles[4]._id, originalDeposit: 1500000, sellingPrice: 1200000, 
      platformFee: 100000, status: 'PENDING', expiredAt: new Date(now.getTime() + 86400000), updatedAt: new Date()
    });
    await openListing.save();

    console.log('--- 7-Day Visual Data Seeded (With Urgent Tasks) ---');
    console.log('\n✅ DATABASE REFRESHED WITH REAL IMAGES!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
