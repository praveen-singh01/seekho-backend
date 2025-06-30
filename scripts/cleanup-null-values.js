#!/usr/bin/env node

/**
 * Cleanup Null Values for Multi-Tenant Indexes
 * 
 * This script removes null values from username and googleId fields
 * to allow creation of sparse unique indexes.
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

const cleanupNullValues = async () => {
  console.log('🧹 Starting Null Values Cleanup...\n');
  
  const db = await connectDB();
  const usersCollection = db.collection('users');
  
  try {
    // Remove null username values
    console.log('🔍 Cleaning up null username values...');
    const usernameResult = await usersCollection.updateMany(
      { username: null },
      { $unset: { username: "" } }
    );
    console.log(`✅ Removed null username from ${usernameResult.modifiedCount} documents`);
    
    // Remove null googleId values
    console.log('🔍 Cleaning up null googleId values...');
    const googleIdResult = await usersCollection.updateMany(
      { googleId: null },
      { $unset: { googleId: "" } }
    );
    console.log(`✅ Removed null googleId from ${googleIdResult.modifiedCount} documents`);
    
    // Now try to create the sparse unique indexes
    console.log('\n🔧 Creating sparse unique indexes...');
    
    const indexesToCreate = [
      {
        key: { packageId: 1, username: 1 },
        options: { unique: true, sparse: true, name: 'packageId_1_username_1_unique' }
      },
      {
        key: { packageId: 1, googleId: 1 },
        options: { unique: true, sparse: true, name: 'packageId_1_googleId_1_unique' }
      }
    ];
    
    for (const indexSpec of indexesToCreate) {
      try {
        await usersCollection.createIndex(indexSpec.key, indexSpec.options);
        console.log(`✅ Created sparse unique index: ${indexSpec.options.name}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`ℹ️  Index ${indexSpec.options.name} already exists`);
        } else {
          console.log(`⚠️  Could not create index ${indexSpec.options.name}:`, error.message);
        }
      }
    }
    
    console.log('\n📋 Final indexes:');
    const finalIndexes = await usersCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✅ Null values cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 Database connection closed');
  }
};

// Run the cleanup
if (require.main === module) {
  cleanupNullValues().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanupNullValues };
