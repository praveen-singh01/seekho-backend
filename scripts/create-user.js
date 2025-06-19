#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Create user function
const createUser = async (userData) => {
  try {
    console.log('🔍 Checking if user already exists...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      console.log('⚠️  User already exists with this email');
      console.log('📋 Existing user details:');
      console.log(`   - ID: ${existingUser._id}`);
      console.log(`   - Name: ${existingUser.name}`);
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Role: ${existingUser.role}`);
      console.log(`   - Provider: ${existingUser.provider}`);
      console.log(`   - Created: ${existingUser.createdAt}`);
      return existingUser;
    }

    console.log('👤 Creating new user...');
    
    // Create new user - password will be hashed by pre-save middleware
    const newUser = await User.create({
      name: userData.name || 'Test User',
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
      provider: 'local',
      isVerified: true, // Set to true for testing
      isActive: true,
      lastLogin: new Date()
    });

    console.log('✅ User created successfully!');
    console.log('📋 User details:');
    console.log(`   - ID: ${newUser._id}`);
    console.log(`   - Name: ${newUser.name}`);
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Role: ${newUser.role}`);
    console.log(`   - Provider: ${newUser.provider}`);
    console.log(`   - Verified: ${newUser.isVerified}`);
    console.log(`   - Created: ${newUser.createdAt}`);

    return newUser;

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    
    if (error.name === 'ValidationError') {
      console.log('📝 Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.log(`   - ${err.path}: ${err.message}`);
      });
    }
    
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting user creation script...\n');
    
    // Connect to database
    await connectDB();
    
    // Get user data from command line arguments or use defaults
    const email = process.argv[2] || 'testuser@gmail.com';
    const password = process.argv[3] || 'praveen@123';
    const name = process.argv[4] || 'Test User';
    const role = process.argv[5] || 'user';
    
    console.log('📝 User data to create:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Password: ${password}`);
    console.log(`   - Name: ${name}`);
    console.log(`   - Role: ${role}\n`);
    
    // Create user
    const user = await createUser({
      email,
      password,
      name,
      role
    });
    
    console.log('\n🎉 Script completed successfully!');
    
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

// Handle script arguments
if (require.main === module) {
  // Script is being run directly
  main();
} else {
  // Script is being imported
  module.exports = { createUser, connectDB };
}
