const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Questionnaire = require('./models/Questionnaire');

async function updateQuestionnaireWithAnswers() {
  try {
    console.log('🔄 Updating questionnaire with expected answers...');
    
    const questionnaire = await Questionnaire.findById('687e8636f132c7fb7db172fc');
    
    if (!questionnaire) {
      console.log('❌ Questionnaire not found');
      return;
    }
    
    console.log(`✅ Found questionnaire: "${questionnaire.title}"`);
    
    // Update questions with expected answers
    questionnaire.questions[0].expectedAnswers = ['goes', 'go'];  // Accept both "goes" and "go"
    questionnaire.questions[0].points = 1;
    
    questionnaire.questions[1].expectedAnswers = [
      'i am reading a book',
      'i am reading a book right now',
      'she is reading a book',
      'he is reading a book',
      'they are reading a book',
      'we are reading a book',
      'I am reading a book',
      'I am reading a book right now',
      'She is reading a book',
      'He is reading a book',
      'They are reading a book',
      'We are reading a book'
    ];
    questionnaire.questions[1].points = 1;
    
    // Set passing score
    questionnaire.passingScore = 70;
    
    await questionnaire.save();
    
    console.log('✅ Updated questionnaire with expected answers:');
    console.log('   Question 1: Expected answers:', questionnaire.questions[0].expectedAnswers);
    console.log('   Question 2: Expected answers:', questionnaire.questions[1].expectedAnswers);
    console.log('   Passing score:', questionnaire.passingScore);
    
  } catch (error) {
    console.error('❌ Error updating questionnaire:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

updateQuestionnaireWithAnswers();
