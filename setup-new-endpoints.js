const mongoose = require('mongoose');
const connectDB = require('./config/database');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Topic = require('./models/Topic');
const Video = require('./models/Video');
const UserProgress = require('./models/UserProgress');
const UserFavorite = require('./models/UserFavorite');
const UserBookmark = require('./models/UserBookmark');
const WatchHistory = require('./models/WatchHistory');
const Notification = require('./models/Notification');

async function setupTestData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Check if we have existing data
    const userCount = await User.countDocuments();
    const categoryCount = await Category.countDocuments();
    const videoCount = await Video.countDocuments();

    console.log(`📊 Current data count:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Videos: ${videoCount}`);

    if (userCount === 0 || categoryCount === 0 || videoCount === 0) {
      console.log('⚠️  Warning: No test data found. Please run the seed script first:');
      console.log('   node seeds/seedData.js');
      return;
    }

    // Get a sample user for testing
    const sampleUser = await User.findOne();
    const sampleCategory = await Category.findOne();
    const sampleTopic = await Topic.findOne();
    const sampleVideo = await Video.findOne();

    if (!sampleUser || !sampleCategory || !sampleTopic || !sampleVideo) {
      console.log('❌ Missing required test data');
      return;
    }

    console.log('\n🧪 Creating sample data for new endpoints...');

    // Create sample progress
    const existingProgress = await UserProgress.findOne({ user: sampleUser._id });
    if (!existingProgress) {
      await UserProgress.create({
        user: sampleUser._id,
        video: sampleVideo._id,
        topic: sampleTopic._id,
        progress: 300,
        duration: sampleVideo.duration,
        completed: false
      });
      console.log('✅ Created sample user progress');
    }

    // Create sample favorite
    const existingFavorite = await UserFavorite.findOne({ user: sampleUser._id });
    if (!existingFavorite) {
      await UserFavorite.create({
        user: sampleUser._id,
        video: sampleVideo._id
      });
      console.log('✅ Created sample favorite');
    }

    // Create sample bookmark
    const existingBookmark = await UserBookmark.findOne({ user: sampleUser._id });
    if (!existingBookmark) {
      await UserBookmark.create({
        user: sampleUser._id,
        video: sampleVideo._id,
        note: 'Important video to review later'
      });
      console.log('✅ Created sample bookmark');
    }

    // Create sample watch history
    const existingHistory = await WatchHistory.findOne({ user: sampleUser._id });
    if (!existingHistory) {
      await WatchHistory.create({
        user: sampleUser._id,
        video: sampleVideo._id,
        progress: 150,
        completed: false,
        deviceType: 'mobile'
      });
      console.log('✅ Created sample watch history');
    }

    // Create sample notification
    const existingNotification = await Notification.findOne({ user: sampleUser._id });
    if (!existingNotification) {
      await Notification.create({
        user: sampleUser._id,
        title: 'Welcome to Seekho!',
        message: 'Start your learning journey with our new features.',
        type: 'info',
        priority: 'medium'
      });
      console.log('✅ Created sample notification');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Test Data IDs for API testing:');
    console.log(`   User ID: ${sampleUser._id}`);
    console.log(`   Category ID: ${sampleCategory._id}`);
    console.log(`   Topic ID: ${sampleTopic._id}`);
    console.log(`   Video ID: ${sampleVideo._id}`);

    console.log('\n🧪 You can now test the endpoints with these IDs:');
    console.log(`   GET /api/categories/${sampleCategory._id}/complete`);
    console.log(`   GET /api/videos/${sampleVideo._id}/stream`);
    console.log(`   GET /api/videos/popular`);
    console.log(`   GET /api/users/watch-history`);
    console.log(`   GET /api/users/favorites`);
    console.log(`   GET /api/users/stats`);

    console.log('\n🔑 Don\'t forget to:');
    console.log('   1. Get a JWT token by logging in');
    console.log('   2. Update the test script with the token');
    console.log('   3. Run: node test-new-endpoints.js');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData };
