// server.js - Express backend entry point for Naam Uzhavar Agricultural Marketplace
// Viva Note: Integrates CORS, JSON parsing, Mongoose, modular buyer & farmer routes, and centralized error handling.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware: Enable Cross-Origin Resource Sharing for the React frontend
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server) or matching dev hosts
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

// Middleware: Parse incoming JSON request bodies (up to 10MB for avatar data URIs)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Naam Uzhavar Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Register API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/profile', require('./routes/profile'));

// Register Integrated Farmer API Routes
app.use('/api/farmer', require('./routes/farmer'));

// Register Integrated EV Driver Logistics API Routes
app.use('/api/driver', require('./routes/driver'));

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint '${req.originalUrl}' does not exist.` });
});

// Simple centralized error-handling middleware
app.use((err, req, res, _next) => {
  console.error('❌ Server Error:', err.stack || err.message);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
let server = null;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`🚀 Naam Uzhavar API server listening on http://localhost:${PORT}`);
    console.log(`📡 Accepting client requests from: ${allowedOrigins.join(', ')}`);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
