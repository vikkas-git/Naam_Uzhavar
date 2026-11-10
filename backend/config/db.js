// config/db.js - MongoDB database connection using Mongoose with resilient fallback
// Viva Note: Connects Node.js to MongoDB using Mongoose, with timeout and resilient fallback if local MongoDB is offline.
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Notice: ${error.message}`);
    console.warn('⚠️ Server operating in Resilient In-Memory Mode with synthetic & persistent demo state.');
    return false;
  }
};

module.exports = connectDB;
