const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
const mongoose = require('mongoose');
const http = require('http');
const SocketService = require('./services/SocketService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
SocketService.init(server);

// Initialize Services
require('./services/cronService');

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // Cho phép mọi IP trong mạng LAN (192.168.x.x)
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Swagger Documentation Route
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Handle basic root route
app.get('/', (req, res) => {
  res.send('Motorbike Rental API is running...');
});
