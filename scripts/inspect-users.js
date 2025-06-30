#!/usr/bin/env node

/**
 * Inspect Users Collection
 * 
 * This script inspects the users collection to understand the data structure
 * and identify issues with duplicate keys.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    return conn.connection.db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const inspectUsers = async () => {
  console.log('🔍 Inspecting Users Collection...\n');
  
  const db = await connectDB();
  const usersCollection = db.collection('users');
  
  try {
    // Count total users
    const totalUsers = await usersCollection.countDocuments();
    console.log(`📊 Total users: ${totalUsers}`);
    
    // Count by package
    const packageCounts = await usersCollection.aggregate([
      { $group: { _id: "$packageId", count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n📦 Users by package:');
    packageCounts.forEach(pkg => {
      console.log(`  - ${pkg._id || 'null/undefined'}: ${pkg.count} users`);
    });
    
    // Check for users with null/undefined username
    console.log('\n👤 Username analysis:');
    const usernameStats = await usersCollection.aggregate([
      {
        $group: {
          _id: {
            packageId: "$packageId",
            hasUsername: { $cond: [{ $ifNull: ["$username", false] }, "has_username", "no_username"] }
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    usernameStats.forEach(stat => {
      console.log(`  - ${stat._id.packageId} (${stat._id.hasUsername}): ${stat.count} users`);
    });
    
    // Check for users with null/undefined googleId
    console.log('\n🔗 GoogleId analysis:');
    const googleIdStats = await usersCollection.aggregate([
      {
        $group: {
          _id: {
            packageId: "$packageId",
            hasGoogleId: { $cond: [{ $ifNull: ["$googleId", false] }, "has_googleId", "no_googleId"] }
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    googleIdStats.forEach(stat => {
      console.log(`  - ${stat._id.packageId} (${stat._id.hasGoogleId}): ${stat.count} users`);
    });
    
    // Find specific problematic documents
    console.log('\n🚨 Problematic documents:');
    
    // Users with same packageId and null username
    const nullUsernameUsers = await usersCollection.find({
      packageId: "com.gumbo.learning",
      $or: [
        { username: null },
        { username: { $exists: false } }
      ]
    }).limit(5).toArray();
    
    console.log(`\n📋 Sample users with null/missing username in com.gumbo.learning (${nullUsernameUsers.length} found):`);
    nullUsernameUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user._id}, Email: ${user.email}, Username: ${user.username}, Provider: ${user.provider}`);
    });
    
    // Users with same packageId and null googleId
    const nullGoogleIdUsers = await usersCollection.find({
      packageId: "com.gumbo.english",
      $or: [
        { googleId: null },
        { googleId: { $exists: false } }
      ]
    }).limit(5).toArray();
    
    console.log(`\n📋 Sample users with null/missing googleId in com.gumbo.english (${nullGoogleIdUsers.length} found):`);
    nullGoogleIdUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user._id}, Email: ${user.email}, GoogleId: ${user.googleId}, Provider: ${user.provider}`);
    });
    
  } catch (error) {
    console.error('❌ Error during inspection:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 Database connection closed');
  }
};

// Run the inspection
if (require.main === module) {
  inspectUsers().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { inspectUsers };
