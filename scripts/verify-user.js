#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seekho');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Verify user credentials
const verifyUser = async (email, password) => {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    console.log('✅ User found!');
    console.log('📋 User details:');
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Provider: ${user.provider}`);
    console.log(`   - Verified: ${user.isVerified}`);
    console.log(`   - Active: ${user.isActive}`);
    console.log(`   - Created: ${user.createdAt}`);
    
    // Verify password
    console.log('\n🔐 Verifying password...');
    const isPasswordValid = await user.comparePassword(password);
    
    if (isPasswordValid) {
      console.log('✅ Password is correct!');
      console.log('🎉 User authentication successful!');
      return true;
    } else {
      console.log('❌ Password is incorrect!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verifying user:', error.message);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting user verification script...\n');
    
    // Connect to database
    await connectDB();
    
    // Get credentials from command line arguments or use defaults
    const email = process.argv[2] || 'testuser@gmail.com';
    const password = process.argv[3] || 'praveen@123';
    
    console.log('📝 Verifying credentials:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Password: ${password}\n`);
    
    // Verify user
    const isValid = await verifyUser(email, password);
    
    if (isValid) {
      console.log('\n✅ Verification completed successfully!');
      console.log('🔑 These credentials can be used for authentication.');
    } else {
      console.log('\n❌ Verification failed!');
      console.log('🚫 These credentials cannot be used for authentication.');
    }
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { verifyUser, connectDB };
