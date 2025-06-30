#!/usr/bin/env node

/**
 * Fix Multi-Tenant Database Indexes
 * 
 * This script removes old global unique indexes and ensures proper multi-tenant indexes
 * are in place for email, username, and googleId fields.
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

const fixIndexes = async () => {
  console.log('🔧 Starting Multi-Tenant Index Fix...\n');
  
  const db = await connectDB();
  const usersCollection = db.collection('users');
  
  try {
    // Get current indexes
    console.log('📋 Current indexes:');
    const currentIndexes = await usersCollection.indexes();
    currentIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    console.log('');
    
    // Drop problematic global unique indexes
    const indexesToDrop = ['email_1', 'username_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        await usersCollection.dropIndex(indexName);
        console.log(`✅ Dropped global unique index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`ℹ️  Index ${indexName} doesn't exist (already dropped)`);
        } else {
          console.log(`⚠️  Could not drop index ${indexName}:`, error.message);
        }
      }
    }
    
    console.log('');
    
    // Create multi-tenant indexes
    const multiTenantIndexes = [
      {
        key: { packageId: 1, email: 1 },
        options: { unique: true, name: 'packageId_1_email_1_unique' }
      },
      {
        key: { packageId: 1, username: 1 },
        options: { unique: true, sparse: true, name: 'packageId_1_username_1_unique' }
      },
      {
        key: { packageId: 1, googleId: 1 },
        options: { unique: true, sparse: true, name: 'packageId_1_googleId_1_unique' }
      },
      {
        key: { packageId: 1, createdAt: -1 },
        options: { name: 'packageId_1_createdAt_-1' }
      },
      {
        key: { packageId: 1, role: 1 },
        options: { name: 'packageId_1_role_1' }
      },
      {
        key: { packageId: 1, isActive: 1 },
        options: { name: 'packageId_1_isActive_1' }
      }
    ];
    
    for (const indexSpec of multiTenantIndexes) {
      try {
        await usersCollection.createIndex(indexSpec.key, indexSpec.options);
        console.log(`✅ Created multi-tenant index: ${indexSpec.options.name}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`ℹ️  Index ${indexSpec.options.name} already exists`);
        } else {
          console.log(`⚠️  Could not create index ${indexSpec.options.name}:`, error.message);
        }
      }
    }
    
    console.log('');
    
    // Show final indexes
    console.log('📋 Final indexes:');
    const finalIndexes = await usersCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✅ Multi-tenant index fix completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Removed global unique constraints on email and username');
    console.log('  - Added multi-tenant unique constraints (packageId + field)');
    console.log('  - Same email can now exist in different apps (packages)');
    console.log('  - Data isolation between Seekho and Bolo apps is maintained');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 Database connection closed');
  }
};

// Run the fix
if (require.main === module) {
  fixIndexes().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixIndexes };
