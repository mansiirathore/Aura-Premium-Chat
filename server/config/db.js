const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      await User.create({
        name: 'Default Admin',
        email: 'admin@gmail.com',
        password: 'admin@123',
        role: 'admin',
        bio: 'System Administrator',
      });
      console.log('Default Admin seeded: admin@gmail.com / admin@123');
    } else {
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
      }
    }
  } catch (error) {
    console.error('Failed to seed default admin:', error);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdmin();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
