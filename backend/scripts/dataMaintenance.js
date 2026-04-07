const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');
const Category = require('../models/Category');
const DepositListing = require('../models/DepositListing');

const runMaintenance = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🚀 Đang bắt đầu bảo trì và làm sạch dữ liệu...');

        // --- 1. Lọc và Xóa Xe ---
        console.log('\n--- Bước 1: Dọn dẹp dữ liệu xe ---');
        
        // Xóa xe không có ảnh
        const noImageVehicles = await Vehicle.deleteMany({
            $or: [
                { images: { $exists: false } },
                { images: { $size: 0 } }
            ]
        });
        console.log(`✅ Đã xóa ${noImageVehicles.deletedCount} xe không có hình ảnh.`);

        // Xóa xe trùng tên
        const allVehicles = await Vehicle.find().sort({ createdAt: 1 });
        const names = new Set();
        const duplicates = [];
        
        for (const v of allVehicles) {
            if (names.has(v.name)) {
                duplicates.push(v._id);
            } else {
                names.add(v.name);
            }
        }
        
        if (duplicates.length > 0) {
            const dupResult = await Vehicle.deleteMany({ _id: { $in: duplicates } });
            console.log(`✅ Đã xóa ${dupResult.deletedCount} xe bị trùng tên.`);
        } else {
            console.log('✅ Không tìm thấy xe nào bị trùng tên.');
        }

        // --- 2. Cập nhật KYC cho User ---
        console.log('\n--- Bước 2: Cập nhật xác thực KYC cho người dùng ---');
        const mockIdentity = {
            cccdFront: 'https://res.cloudinary.com/drjftpqxh/image/upload/v1712411234/cccd_front_sample.jpg',
            cccdBack: 'https://res.cloudinary.com/drjftpqxh/image/upload/v1712411235/cccd_back_sample.jpg',
            drivingLicense: 'https://res.cloudinary.com/drjftpqxh/image/upload/v1712411236/gplx_sample.jpg',
            verifyStatus: 'VERIFIED'
        };

        const updatedUsers = await User.updateMany(
            { email: 'user1@test.com' },
            { 
               $set: { 
                  identity: mockIdentity,
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
                  sellerRating: 4.8,
                  totalSales: 12
               } 
            }
        );
        await User.updateMany(
            { email: 'user2@test.com' },
            { 
               $set: { 
                  identity: mockIdentity,
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop',
                  sellerRating: 5.0,
                  totalSales: 24
               } 
            }
        );
        console.log(`✅ Đã cập nhật xác thực (KYC), ảnh đại diện và uy tín cho người dùng.`);

        // --- 3. Tạo dữ liệu mẫu Săn cọc & Đơn hàng ---
        console.log('\n--- Bước 3: Tạo đơn hàng và tin Săn cọc mẫu ---');
        
        // Lấy danh sách cần thiết
        const user1 = await User.findOne({ email: 'user1@test.com' });
        const user2 = await User.findOne({ email: 'user2@test.com' });
        const vehicles = await Vehicle.find().limit(5);

        if (!user1 || !user2 || vehicles.length < 2) {
            console.log('⚠️ Thiếu dữ liệu người dùng hoặc xe để tạo đơn hàng mẫu.');
        } else {
            // Xóa dữ liệu cũ để tránh trùng mã đơn (nếu có)
            await Order.deleteMany({ orderCode: { $in: ['SAMPLE001', 'SAMPLE002', 'SAMPLE003'] } });
            await DepositListing.deleteMany({}); // Clear marketplace

            const now = new Date();
            const sampleOrders = [
                {
                    orderCode: 'SAMPLE001', userId: user1._id, vehicleId: vehicles[0]._id,
                    startDate: now, endDate: new Date(now.getTime() + 86400000 * 3),
                    totalDays: 3, rentalPrice: vehicles[0].pricePerDay, depositAmount: vehicles[0].depositAmount,
                    totalAmount: (vehicles[0].pricePerDay * 3) + vehicles[0].depositAmount,
                    status: 'CONFIRMED', paymentStatus: 'PAID', paymentMethod: 'WALLET'
                },
                {
                    orderCode: 'SAMPLE002', userId: user2._id, vehicleId: vehicles[1]._id,
                    startDate: now, endDate: new Date(now.getTime() + 86400000 * 2),
                    totalDays: 2, rentalPrice: vehicles[1].pricePerDay, depositAmount: vehicles[1].depositAmount,
                    totalAmount: (vehicles[1].pricePerDay * 2) + vehicles[1].depositAmount,
                    status: 'RENTING', paymentStatus: 'PAID', paymentMethod: 'WALLET'
                }
            ];

            const createdOrders = await Order.insertMany(sampleOrders);
            console.log('✅ Đã tạo đơn hàng mẫu cho User 1 và User 2.');

            // Tạo tin Săn cọc (Marketplace)
            const listings = createdOrders.map(order => ({
                sellerId: order.userId,
                orderId: order._id,
                vehicleId: order.vehicleId,
                originalDeposit: order.depositAmount,
                sellingPrice: order.depositAmount * 0.7, // Bán lỗ 30%
                platformFee: order.depositAmount * 0.05,
                expiredAt: new Date(now.getTime() + 86400000), // Hết hạn sau 1 ngày
                status: 'OPEN'
            }));

            await DepositListing.insertMany(listings);
            console.log(`✅ Đã đăng ${listings.length} tin Săn cọc (Marketplace) mẫu.`);
        }

        console.log('\n✨ TẤT CẢ TÁC VỤ BẢO TRÌ ĐÃ HOÀN TẤT!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi bảo trì:', error);
        process.exit(1);
    }
};

runMaintenance();
