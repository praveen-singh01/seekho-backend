/**
 * Migration script to add packageId field to existing data
 * This ensures backward compatibility with existing Seekho app data
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Topic = require('../models/Topic');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
const UserProgress = require('../models/UserProgress');
const UserFavorite = require('../models/UserFavorite');
const UserBookmark = require('../models/UserBookmark');
const WatchHistory = require('../models/WatchHistory');
const Notification = require('../models/Notification');

const { DEFAULT_PACKAGE_ID } = require('../config/packages');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seekho-backend');
    console.log('📦 MongoDB Connected for migration');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Migration functions for each model
const migrateUsers = async () => {
  console.log('🔄 Migrating Users...');
  const result = await User.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} users`);
  return result.modifiedCount;
};

const migrateCategories = async () => {
  console.log('🔄 Migrating Categories...');
  const result = await Category.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} categories`);
  return result.modifiedCount;
};

const migrateTopics = async () => {
  console.log('🔄 Migrating Topics...');
  const result = await Topic.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} topics`);
  return result.modifiedCount;
};

const migrateVideos = async () => {
  console.log('🔄 Migrating Videos...');
  const result = await Video.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} videos`);
  return result.modifiedCount;
};

const migrateSubscriptions = async () => {
  console.log('🔄 Migrating Subscriptions...');
  const result = await Subscription.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} subscriptions`);
  return result.modifiedCount;
};

const migrateUserProgress = async () => {
  console.log('🔄 Migrating User Progress...');
  const result = await UserProgress.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} user progress records`);
  return result.modifiedCount;
};

const migrateUserFavorites = async () => {
  console.log('🔄 Migrating User Favorites...');
  const result = await UserFavorite.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} user favorites`);
  return result.modifiedCount;
};

const migrateUserBookmarks = async () => {
  console.log('🔄 Migrating User Bookmarks...');
  const result = await UserBookmark.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} user bookmarks`);
  return result.modifiedCount;
};

const migrateWatchHistory = async () => {
  console.log('🔄 Migrating Watch History...');
  const result = await WatchHistory.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} watch history records`);
  return result.modifiedCount;
};

const migrateNotifications = async () => {
  console.log('🔄 Migrating Notifications...');
  const result = await Notification.updateMany(
    { packageId: { $exists: false } },
    { $set: { packageId: DEFAULT_PACKAGE_ID } }
  );
  console.log(`✅ Updated ${result.modifiedCount} notifications`);
  return result.modifiedCount;
};

// Verify migration
const verifyMigration = async () => {
  console.log('🔍 Verifying migration...');
  
  const models = [
    { name: 'Users', model: User },
    { name: 'Categories', model: Category },
    { name: 'Topics', model: Topic },
    { name: 'Videos', model: Video },
    { name: 'Subscriptions', model: Subscription },
    { name: 'UserProgress', model: UserProgress },
    { name: 'UserFavorites', model: UserFavorite },
    { name: 'UserBookmarks', model: UserBookmark },
    { name: 'WatchHistory', model: WatchHistory },
    { name: 'Notifications', model: Notification }
  ];

  for (const { name, model } of models) {
    const totalCount = await model.countDocuments({});
    const migratedCount = await model.countDocuments({ packageId: { $exists: true } });
    const unmigrated = totalCount - migratedCount;
    
    console.log(`${name}: ${migratedCount}/${totalCount} migrated${unmigrated > 0 ? ` (${unmigrated} remaining)` : ''}`);
    
    if (unmigrated > 0) {
      console.warn(`⚠️  ${name} has ${unmigrated} records without packageId`);
    }
  }
};

// Main migration function
const runMigration = async () => {
  try {
    console.log('🚀 Starting Package ID Migration...');
    console.log(`📦 Default Package ID: ${DEFAULT_PACKAGE_ID}`);
    
    await connectDB();
    
    let totalUpdated = 0;
    
    // Run all migrations
    totalUpdated += await migrateUsers();
    totalUpdated += await migrateCategories();
    totalUpdated += await migrateTopics();
    totalUpdated += await migrateVideos();
    totalUpdated += await migrateSubscriptions();
    totalUpdated += await migrateUserProgress();
    totalUpdated += await migrateUserFavorites();
    totalUpdated += await migrateUserBookmarks();
    totalUpdated += await migrateWatchHistory();
    totalUpdated += await migrateNotifications();
    
    console.log(`\n🎉 Migration completed! Total records updated: ${totalUpdated}`);
    
    // Verify migration
    await verifyMigration();
    
    console.log('\n✅ Migration verification completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
};

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  verifyMigration
};
