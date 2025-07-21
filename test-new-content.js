const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Category = require('./models/Category');
const Topic = require('./models/Topic');
const Questionnaire = require('./models/Questionnaire');
const MCQ = require('./models/MCQ');
const LearningModule = require('./models/LearningModule');
const User = require('./models/User');

// Use the existing database connection
const connectDB = require('./config/database');

const createTestData = async () => {
  try {
    console.log('🚀 Creating test data for Bolo app...');

    // Create a test admin user
    let adminUser = await User.findOne({ 
      email: 'admin@bolo.com',
      packageId: 'com.gumbo.english'
    });

    if (!adminUser) {
      adminUser = await User.create({
        packageId: 'com.gumbo.english',
        name: 'Bolo Admin',
        email: 'admin@bolo.com',
        googleId: 'test-admin-123',
        isActive: true,
        role: 'admin'
      });
      console.log('✅ Created admin user');
    }

    // Create a category for English learning
    let category = await Category.findOne({ 
      name: 'English Grammar',
      packageId: 'com.gumbo.english'
    });

    if (!category) {
      category = await Category.create({
        packageId: 'com.gumbo.english',
        name: 'English Grammar',
        description: 'Learn English grammar fundamentals',
        color: '#28a745',
        order: 1,
        isActive: true
      });
      console.log('✅ Created English Grammar category');
    }

    // Create a topic
    let topic = await Topic.findOne({ 
      title: 'Basic Tenses',
      packageId: 'com.gumbo.english'
    });

    if (!topic) {
      topic = await Topic.create({
        packageId: 'com.gumbo.english',
        title: 'Basic Tenses',
        description: 'Learn about present, past, and future tenses',
        category: category._id,
        difficulty: 'beginner',
        estimatedDuration: 30,
        isActive: true,
        isPremium: false,
        order: 1
      });
      console.log('✅ Created Basic Tenses topic');
    }

    // Create a questionnaire
    let questionnaire = await Questionnaire.findOne({ 
      title: 'Present Tense Practice',
      packageId: 'com.gumbo.english'
    });

    if (!questionnaire) {
      questionnaire = await Questionnaire.create({
        packageId: 'com.gumbo.english',
        title: 'Present Tense Practice',
        description: 'Practice questions on present tense usage',
        topic: topic._id,
        questions: [
          {
            questionText: 'What is the present tense of "go" for third person singular?',
            questionType: 'short_answer',
            isRequired: true,
            order: 0,
            hints: ['Think about he/she/it'],
            maxLength: 50
          },
          {
            questionText: 'Write a sentence using present continuous tense.',
            questionType: 'long_answer',
            isRequired: true,
            order: 1,
            hints: ['Use am/is/are + verb+ing'],
            maxLength: 200
          }
        ],
        difficulty: 'beginner',
        estimatedTime: 10,
        isActive: true,
        isPremium: false,
        order: 1,
        createdBy: adminUser._id
      });
      console.log('✅ Created Present Tense Practice questionnaire');
    }

    // Create an MCQ
    let mcq = await MCQ.findOne({ 
      title: 'Tense Identification Quiz',
      packageId: 'com.gumbo.english'
    });

    if (!mcq) {
      mcq = await MCQ.create({
        packageId: 'com.gumbo.english',
        title: 'Tense Identification Quiz',
        description: 'Identify the correct tense in given sentences',
        topic: topic._id,
        questions: [
          {
            questionText: 'What tense is used in: "She is reading a book"?',
            options: [
              { text: 'Simple Present', isCorrect: false },
              { text: 'Present Continuous', isCorrect: true },
              { text: 'Present Perfect', isCorrect: false },
              { text: 'Past Continuous', isCorrect: false }
            ],
            explanation: 'Present continuous tense uses am/is/are + verb+ing',
            order: 0,
            difficulty: 'easy',
            points: 1
          },
          {
            questionText: 'Choose the correct present tense form: "He _____ to school every day."',
            options: [
              { text: 'go', isCorrect: false },
              { text: 'goes', isCorrect: true },
              { text: 'going', isCorrect: false },
              { text: 'gone', isCorrect: false }
            ],
            explanation: 'For third person singular, we add -s or -es to the verb',
            order: 1,
            difficulty: 'easy',
            points: 1
          }
        ],
        difficulty: 'beginner',
        estimatedTime: 5,
        passingScore: 70,
        isActive: true,
        isPremium: false,
        order: 2,
        createdBy: adminUser._id
      });
      console.log('✅ Created Tense Identification Quiz MCQ');
    }

    // Create a learning module
    let learningModule = await LearningModule.findOne({ 
      title: 'Present Tense Mastery',
      packageId: 'com.gumbo.english'
    });

    if (!learningModule) {
      learningModule = await LearningModule.create({
        packageId: 'com.gumbo.english',
        title: 'Present Tense Mastery',
        description: 'Complete learning module for mastering present tense',
        topic: topic._id,
        content: [
          {
            contentType: 'questionnaire',
            contentId: questionnaire._id,
            contentModel: 'Questionnaire',
            order: 1,
            isRequired: true
          },
          {
            contentType: 'mcq',
            contentId: mcq._id,
            contentModel: 'MCQ',
            order: 2,
            isRequired: true
          }
        ],
        difficulty: 'beginner',
        estimatedDuration: 15,
        isActive: true,
        isPremium: false,
        order: 1,
        createdBy: adminUser._id
      });
      console.log('✅ Created Present Tense Mastery learning module');
    }

    console.log('\n🎉 Test data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Category: ${category.name}`);
    console.log(`   - Topic: ${topic.title}`);
    console.log(`   - Questionnaire: ${questionnaire.title}`);
    console.log(`   - MCQ: ${mcq.title}`);
    console.log(`   - Learning Module: ${learningModule.title}`);
    console.log(`   - Admin User: ${adminUser.email}`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
};

const main = async () => {
  await connectDB();
  await createTestData();
  process.exit(0);
};

main();
