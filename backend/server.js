require('dotenv').config(); // ✅ LUÔN đặt trên cùng

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
const mongoose = require('mongoose');
const http = require('http');
const SocketService = require('./services/SocketService');

const app = express();
const server = http.createServer(app);

// ⚠️ Railway tự cấp PORT → không fix cứng
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
SocketService.init(server);

// Initialize Services
require('./services/cronService');

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^https:\/\/.*\.vercel\.app$/ // cho phép frontend vercel
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/fleet', require('./routes/vehicle'));
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Root test
app.get('/', (req, res) => {
  res.send('Motorbike Rental API is running...');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


// ================== ✅ CHECK ENV (THÊM Ở ĐÂY) ==================
const requiredEnvs = [
  'MONGODB_URI',
  'JWT_SECRET'
  // nếu bạn dùng email thì mở ra:
  // 'EMAIL_USER',
  // 'EMAIL_PASS'
];

const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error('❌ Missing environment variables:');
  missingEnvs.forEach(env => console.error(`- ${env}`));
  process.exit(1);
}
// ===============================================================


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
