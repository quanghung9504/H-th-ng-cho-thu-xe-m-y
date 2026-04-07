const socketIo = require('socket.io');

let io;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // Thêm dải IP mạng LAN
  /\.vercel\.app$/,
];

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`Socket ${socket.id} joined admin_room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Broadcasters
const notifyNewOrder = (order) => {
  if (io) {
    io.to('admin_room').emit('new_order', {
      message: `Đơn hàng mới: ${order.orderCode}`,
      order
    });
  }
};

const notifyOrderConfirmed = (userId, order) => {
  if (io) {
    io.emit(`order_confirmed_${userId}`, {
      message: `Đơn hàng ${order.orderCode} của bạn đã được xác nhận!`,
      order
    });
  }
};

const notifyMarketplaceSold = (sellerId, listing) => {
  if (io) {
    io.emit(`marketplace_sold_${sellerId}`, {
      message: `Suất cọc của bạn đã được bán thành công!`,
      amount: listing.sellingPrice
    });
  }
};

const notifyNewMarketplaceListing = (listing) => {
  if (io) {
    io.emit('new_marketplace_listing', {
      message: 'Có suất cọc mới vừa được cập nhật trên chợ!',
      listing
    });
  }
};

const sendNotification = (data) => {
  if (!io) return;
  const { userId, title, message, type, status, isAdmin, refId, createdAt } = data;
  
  const payload = { title, message, type, status, refId, createdAt: createdAt || new Date() };

  if (isAdmin) {
    io.to('admin_room').emit('new_notification', payload);
  } else if (userId) {
    io.emit(`notification_${userId}`, payload);
  }
};

module.exports = {
  init,
  getIO,
  notifyNewOrder,
  notifyOrderConfirmed,
  notifyMarketplaceSold,
  notifyNewMarketplaceListing,
  sendNotification
};
