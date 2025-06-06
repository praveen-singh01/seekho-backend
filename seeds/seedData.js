const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Topic = require('../models/Topic');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Sample data
const categories = [
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Learn gaming strategies, tips, and techniques',
    color: '#FF6B6B',
    order: 1
  },
  {
    name: 'Astrology',
    slug: 'astrology',
    description: 'Explore the mysteries of astrology and cosmic influences',
    color: '#4ECDC4',
    order: 2
  },
  {
    name: 'English',
    slug: 'english',
    description: 'Master the English language with comprehensive lessons',
    color: '#45B7D1',
    order: 3
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Stay updated with the latest in technology and programming',
    color: '#96CEB4',
    order: 4
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Learn business strategies and entrepreneurship',
    color: '#FFEAA7',
    order: 5
  }
];

const topics = [
  // Gaming topics
  {
    title: 'PUBG Mobile Strategies',
    slug: 'pubg-mobile-strategies',
    description: 'Advanced strategies for PUBG Mobile gameplay',
    difficulty: 'intermediate',
    estimatedDuration: 120,
    isPremium: true,
    order: 1
  },
  {
    title: 'Free Fire Tips & Tricks',
    slug: 'free-fire-tips-tricks',
    description: 'Master Free Fire with these essential tips',
    difficulty: 'beginner',
    estimatedDuration: 90,
    isPremium: false,
    order: 2
  },
  
  // Astrology topics
  {
    title: 'Zodiac Signs Basics',
    slug: 'zodiac-signs-basics',
    description: 'Understanding the 12 zodiac signs and their characteristics',
    difficulty: 'beginner',
    estimatedDuration: 150,
    isPremium: false,
    order: 1
  },
  {
    title: 'Vedic Astrology',
    slug: 'vedic-astrology',
    description: 'Deep dive into Vedic astrology principles',
    difficulty: 'advanced',
    estimatedDuration: 300,
    isPremium: true,
    order: 2
  },

  // English topics
  {
    title: 'English Grammar Fundamentals',
    slug: 'english-grammar-fundamentals',
    description: 'Master the basics of English grammar',
    difficulty: 'beginner',
    estimatedDuration: 180,
    isPremium: false,
    order: 1
  },
  {
    title: 'Advanced English Tenses',
    slug: 'advanced-english-tenses',
    description: 'Complete guide to English tenses with examples',
    difficulty: 'intermediate',
    estimatedDuration: 240,
    isPremium: true,
    order: 2
  },

  // Technology topics
  {
    title: 'JavaScript Basics',
    slug: 'javascript-basics',
    description: 'Learn JavaScript programming from scratch',
    difficulty: 'beginner',
    estimatedDuration: 360,
    isPremium: true,
    order: 1
  },

  // Business topics
  {
    title: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Complete guide to digital marketing strategies',
    difficulty: 'intermediate',
    estimatedDuration: 300,
    isPremium: true,
    order: 1
  }
];

const videos = [
  // PUBG Mobile Strategies videos
  {
    title: 'PUBG Mobile: Landing Strategies',
    slug: 'pubg-mobile-landing-strategies',
    description: 'Learn the best landing spots and strategies for PUBG Mobile',
    videoUrl: 'https://example.com/video1.mp4',
    duration: 600, // 10 minutes
    episodeNumber: 1,
    isLocked: true,
    isFree: false,
    quality: '720p'
  },
  {
    title: 'PUBG Mobile: Weapon Selection Guide',
    slug: 'pubg-mobile-weapon-selection-guide',
    description: 'Choose the right weapons for different situations',
    videoUrl: 'https://example.com/video2.mp4',
    duration: 720, // 12 minutes
    episodeNumber: 2,
    isLocked: true,
    isFree: false,
    quality: '720p'
  },
  
  // Free Fire Tips videos
  {
    title: 'Free Fire: Character Selection',
    slug: 'free-fire-character-selection',
    description: 'Best characters for different game modes',
    videoUrl: 'https://example.com/video3.mp4',
    duration: 480, // 8 minutes
    episodeNumber: 1,
    isLocked: false,
    isFree: true,
    quality: '720p'
  },

  // Zodiac Signs videos
  {
    title: 'Introduction to Zodiac Signs',
    slug: 'introduction-to-zodiac-signs',
    description: 'Overview of all 12 zodiac signs',
    videoUrl: 'https://example.com/video4.mp4',
    duration: 900, // 15 minutes
    episodeNumber: 1,
    isLocked: false,
    isFree: true,
    quality: '720p'
  },

  // English Grammar videos
  {
    title: 'Parts of Speech',
    slug: 'parts-of-speech',
    description: 'Understanding nouns, verbs, adjectives, and more',
    videoUrl: 'https://example.com/video5.mp4',
    duration: 1080, // 18 minutes
    episodeNumber: 1,
    isLocked: false,
    isFree: true,
    quality: '720p'
  },

  // Advanced Tenses videos
  {
    title: 'Present Perfect Tense',
    slug: 'present-perfect-tense',
    description: 'Master the present perfect tense with examples',
    videoUrl: 'https://example.com/video6.mp4',
    duration: 960, // 16 minutes
    episodeNumber: 1,
    isLocked: true,
    isFree: false,
    quality: '720p'
  }
];

// Seed function
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Topic.deleteMany({});
    await Video.deleteMany({});
    await Subscription.deleteMany({});
    
    console.log('🗑️  Cleared existing data');
    
    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    const adminUser = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@seekho.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      provider: 'local'
    });
    
    console.log('👤 Created admin user');
    
    // Create sample regular user
    const sampleUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      googleId: 'sample_google_id',
      profilePicture: 'https://example.com/avatar.jpg',
      provider: 'google',
      isVerified: true
    });
    
    console.log('👤 Created sample user');
    
    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log('📂 Created categories');
    
    // Create topics with category references
    const topicsWithCategories = topics.map((topic, index) => ({
      ...topic,
      category: createdCategories[Math.floor(index / 2)]._id // Distribute topics across categories
    }));
    
    const createdTopics = await Topic.insertMany(topicsWithCategories);
    console.log('📚 Created topics');
    
    // Create videos with topic references
    const videosWithTopics = videos.map((video, index) => ({
      ...video,
      topic: createdTopics[index]._id,
      uploadedBy: adminUser._id
    }));
    
    await Video.insertMany(videosWithTopics);
    console.log('🎥 Created videos');
    
    // Create sample subscription for the sample user
    const subscription = await Subscription.create({
      user: sampleUser._id,
      plan: 'monthly',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      amount: 19900, // ₹199 in paise
      currency: 'INR',
      paymentProvider: 'razorpay',
      paymentId: 'sample_payment_id',
      orderId: 'sample_order_id',
      signature: 'sample_signature'
    });
    
    // Update user with subscription reference
    await User.findByIdAndUpdate(sampleUser._id, { subscription: subscription._id });
    
    console.log('💳 Created sample subscription');
    
    // Update metadata for categories and topics
    for (const category of createdCategories) {
      await category.updateMetadata();
    }
    
    for (const topic of createdTopics) {
      await topic.updateMetadata();
    }
    
    console.log('📊 Updated metadata');
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Seeded data summary:');
    console.log(`   - ${createdCategories.length} categories`);
    console.log(`   - ${createdTopics.length} topics`);
    console.log(`   - ${videosWithTopics.length} videos`);
    console.log(`   - 2 users (1 admin, 1 regular)`);
    console.log(`   - 1 active subscription`);
    console.log('\n🔑 Admin credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding
if (require.main === module) {
  connectDB().then(() => {
    seedData();
  });
}

module.exports = { seedData };
