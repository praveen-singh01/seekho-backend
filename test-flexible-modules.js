const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Category = require('./models/Category');
const Topic = require('./models/Topic');
const TextContent = require('./models/TextContent');
const LearningModule = require('./models/LearningModule');
const User = require('./models/User');

// Use the existing database connection
const connectDB = require('./config/database');

const createFlexibleModuleTest = async () => {
  try {
    console.log('🚀 Creating Flexible Learning Module Test for Bolo App...\n');

    // Get existing data
    const adminUser = await User.findOne({ 
      email: 'admin@bolo.com',
      packageId: 'com.gumbo.english'
    });

    const topic = await Topic.findOne({ 
      title: 'Basic Tenses',
      packageId: 'com.gumbo.english'
    });

    if (!adminUser || !topic) {
      console.log('❌ Please run test-new-content.js first to create basic data');
      return;
    }

    // Create different types of text content that teachers can add
    console.log('📝 Creating flexible text content...');

    // 1. Summary content
    const summary = await TextContent.create({
      packageId: 'com.gumbo.english',
      title: 'Present Tense Summary',
      description: 'Quick summary of present tense rules',
      topic: topic._id,
      contentType: 'summary',
      content: `# Present Tense Summary

The present tense is used to describe:
- Current actions: "I am reading"
- Habitual actions: "She goes to school every day"
- General truths: "Water boils at 100°C"

## Forms:
- Simple Present: I/You/We/They + verb, He/She/It + verb+s
- Present Continuous: am/is/are + verb+ing
- Present Perfect: have/has + past participle`,
      contentFormat: 'markdown',
      difficulty: 'beginner',
      isActive: true,
      isPremium: false,
      order: 1,
      createdBy: adminUser._id
    });

    // 2. Reading material
    const reading = await TextContent.create({
      packageId: 'com.gumbo.english',
      title: 'Daily Routine Reading',
      description: 'Reading passage about daily routines using present tense',
      topic: topic._id,
      contentType: 'reading',
      content: `My Daily Routine

Every morning, I wake up at 6:30 AM. I brush my teeth and take a shower. Then I have breakfast with my family. We usually eat toast and drink coffee.

At 8:00 AM, I leave for work. I take the bus because I don't have a car. The journey takes about 30 minutes.

I work in an office from 9:00 AM to 5:00 PM. During lunch break, I eat with my colleagues. We often talk about our weekend plans.

After work, I go to the gym. I exercise for one hour. Then I return home and have dinner.

In the evening, I watch TV or read a book. I go to bed at 10:30 PM.

This is my typical day. What about yours?`,
      contentFormat: 'plain',
      difficulty: 'beginner',
      isActive: true,
      isPremium: false,
      order: 2,
      resources: [
        {
          title: 'Audio Recording',
          url: 'https://example.com/audio/daily-routine.mp3',
          type: 'audio'
        }
      ],
      createdBy: adminUser._id
    });

    // 3. Instructions content
    const instructions = await TextContent.create({
      packageId: 'com.gumbo.english',
      title: 'How to Form Present Continuous',
      description: 'Step-by-step instructions for forming present continuous tense',
      topic: topic._id,
      contentType: 'instructions',
      content: `How to Form Present Continuous Tense

Step 1: Choose the correct form of "be"
- I → am
- You/We/They → are  
- He/She/It → is

Step 2: Add the main verb with -ing
- talk → talking
- run → running (double the consonant)
- write → writing (drop the silent e)

Step 3: Combine them
- I am talking
- You are running
- She is writing

Step 4: For questions, put "be" first
- Am I talking?
- Are you running?
- Is she writing?

Step 5: For negatives, add "not" after "be"
- I am not talking
- You are not running
- She is not writing

Practice these steps with different verbs!`,
      contentFormat: 'plain',
      difficulty: 'beginner',
      isActive: true,
      isPremium: false,
      order: 3,
      createdBy: adminUser._id
    });

    // 4. Study notes
    const notes = await TextContent.create({
      packageId: 'com.gumbo.english',
      title: 'Present Tense Key Points',
      description: 'Important notes and tips for present tense usage',
      topic: topic._id,
      contentType: 'notes',
      content: `📚 Present Tense Study Notes

🔑 Key Points to Remember:

1. Third Person Singular Rule
   - Add -s or -es to verbs with he/she/it
   - go → goes, watch → watches, study → studies

2. Time Expressions
   - Simple Present: always, usually, often, sometimes, never
   - Present Continuous: now, right now, at the moment, currently

3. Common Mistakes to Avoid:
   ❌ He go to school (WRONG)
   ✅ He goes to school (CORRECT)
   
   ❌ I am go to work (WRONG)
   ✅ I am going to work (CORRECT)

4. Spelling Rules for -ing:
   - Most verbs: just add -ing (play → playing)
   - Verbs ending in -e: drop e, add -ing (make → making)
   - Short verbs ending in consonant: double it (run → running)

💡 Pro Tips:
- Use present continuous for temporary actions
- Use simple present for permanent situations
- Practice with real-life examples!`,
      contentFormat: 'plain',
      difficulty: 'beginner',
      isActive: true,
      isPremium: false,
      tags: ['grammar', 'tips', 'study-guide'],
      order: 4,
      createdBy: adminUser._id
    });

    console.log('✅ Created 4 different types of text content');

    // Create a comprehensive learning module with mixed content
    console.log('🎓 Creating flexible learning module...');

    const flexibleModule = await LearningModule.create({
      packageId: 'com.gumbo.english',
      title: 'Complete Present Tense Course',
      description: 'A comprehensive course covering all aspects of present tense with mixed content types',
      topic: topic._id,
      content: [
        // Start with summary
        {
          contentType: 'summary',
          contentId: summary._id,
          contentModel: 'TextContent',
          order: 0,
          isRequired: true,
          customTitle: 'Course Overview',
          customDescription: 'Start here to get an overview of present tense'
        },
        // Then reading material
        {
          contentType: 'reading',
          contentId: reading._id,
          contentModel: 'TextContent',
          order: 1,
          isRequired: true,
          customTitle: 'Practice Reading',
          customDescription: 'Read this passage and identify present tense verbs'
        },
        // Instructions for formation
        {
          contentType: 'instructions',
          contentId: instructions._id,
          contentModel: 'TextContent',
          order: 2,
          isRequired: true,
          customTitle: 'How to Form Tenses',
          customDescription: 'Learn the step-by-step process'
        },
        // Study notes for reference
        {
          contentType: 'notes',
          contentId: notes._id,
          contentModel: 'TextContent',
          order: 3,
          isRequired: false,
          customTitle: 'Quick Reference',
          customDescription: 'Keep these notes handy while practicing'
        }
      ],
      difficulty: 'beginner',
      estimatedDuration: 45,
      isActive: true,
      isPremium: false,
      order: 1,
      createdBy: adminUser._id
    });

    console.log('✅ Created flexible learning module with mixed content types');

    console.log('\n🎉 Flexible Module Test Summary:');
    console.log(`📋 Module: ${flexibleModule.title}`);
    console.log(`📊 Content Items: ${flexibleModule.content.length}`);
    console.log(`📝 Text Content: ${flexibleModule.metadata.totalTextContent}`);
    console.log(`⏱️  Estimated Duration: ${flexibleModule.estimatedDuration} minutes`);
    
    console.log('\n📚 Content Types Created:');
    console.log(`1. Summary: ${summary.title} (${summary.wordCount} words)`);
    console.log(`2. Reading: ${reading.title} (${reading.wordCount} words)`);
    console.log(`3. Instructions: ${instructions.title} (${instructions.wordCount} words)`);
    console.log(`4. Notes: ${notes.title} (${notes.wordCount} words)`);

    console.log('\n✨ Teachers can now add ANY type of content to learning modules:');
    console.log('- 📄 Text summaries');
    console.log('- 📖 Reading materials');
    console.log('- 📋 Step-by-step instructions');
    console.log('- 📝 Study notes');
    console.log('- 💡 Explanations');
    console.log('- 🎥 Videos');
    console.log('- ❓ Questionnaires');
    console.log('- 🧩 Multiple choice quizzes');
    console.log('- 🔗 External resources');

    console.log('\n🚀 Flexible Learning Module System Ready for Bolo App!');

  } catch (error) {
    console.error('❌ Error creating flexible module test:', error);
  }
};

const main = async () => {
  await connectDB();
  await createFlexibleModuleTest();
  process.exit(0);
};

main();
