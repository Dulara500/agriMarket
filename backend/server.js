require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const pool = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { startReservationCleanup } = require('./src/services/reservationCleanup');
const { authenticate } = require('./src/middleware/auth');

// Routes
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const farmerRoutes = require('./src/routes/farmer');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const adminRoutes = require('./src/routes/admin');
const notificationRoutes = require('./src/routes/notifications');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }
});

// Make io accessible in routes
app.set('io', io);

// Socket auth & connection
const jwt = require('jsonwebtoken');
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId}`);
  socket.join(`user:${socket.userId}`);
  socket.join(`role:${socket.userRole}`);
  socket.on('disconnect', () => console.log(`🔌 User disconnected: ${socket.userId}`));
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected');

    // Ensure id_number exists in users table
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);
    `);
    console.log('✅ Checked id_number column in users table');

    // Auto-create product_requests table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        unit VARCHAR(20) DEFAULT 'kg',
        suggested_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Checked product_requests table');

    server.listen(PORT, () => {
      console.log(`🚀 AgriMarket server running on http://localhost:${PORT}`);
      startReservationCleanup();
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    console.error('Please ensure PostgreSQL is running and .env is configured correctly');
    process.exit(1);
  }
};

start();
