const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';
const PACKAGE_ID = 'com.gumbo.english';

async function testAdminQuestionnaireCreation() {
  try {
    console.log('🔐 Step 1: Admin Login');
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
      username: 'superadmin',
      password: 'superadmin@123'
    });
    
    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin login successful');

    console.log('\n📝 Step 2: Create questionnaire with expected answers');
    const questionnaireData = {
      title: `Advanced English Grammar Test ${Date.now()}`,
      description: 'Test your advanced English grammar knowledge with auto-scoring',
      topic: '687e8635f132c7fb7db172f2', // Basic Tenses topic
      difficulty: 'intermediate',
      estimatedTime: 20,
      passingScore: 75,
      isPremium: false,
      questions: [
        {
          questionText: 'What is the past tense of "run"?',
          questionType: 'short_answer',
          isRequired: true,
          order: 0,
          hints: ['Think about yesterday'],
          maxLength: 50,
          expectedAnswers: ['ran'],
          points: 1
        },
        {
          questionText: 'Write a sentence using past perfect tense.',
          questionType: 'long_answer',
          isRequired: true,
          order: 1,
          hints: ['Use had + past participle'],
          maxLength: 200,
          expectedAnswers: [
            'I had finished my homework',
            'She had eaten dinner',
            'They had left the party',
            'He had completed the task'
          ],
          points: 2
        },
        {
          questionText: 'Choose the correct form: "I _____ to the store yesterday."',
          questionType: 'short_answer',
          isRequired: true,
          order: 2,
          hints: ['Past tense of go'],
          maxLength: 20,
          expectedAnswers: ['went'],
          points: 1
        }
      ]
    };

    const createResponse = await axios.post(`${BASE_URL}/admin/questionnaires`, questionnaireData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Package-ID': PACKAGE_ID,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Questionnaire created successfully!');
    console.log('📊 Created questionnaire:', {
      id: createResponse.data.data._id,
      title: createResponse.data.data.title,
      passingScore: createResponse.data.data.passingScore,
      questionsCount: createResponse.data.data.questions.length
    });

    const newQuestionnaireId = createResponse.data.data._id;

    console.log('\n📝 Step 3: Test the new questionnaire submission');
    const testAnswers = {
      answers: [
        {
          questionIndex: 0,
          textAnswer: 'ran',
          timeSpent: 15
        },
        {
          questionIndex: 1,
          textAnswer: 'I had finished my homework before dinner.',
          timeSpent: 60
        },
        {
          questionIndex: 2,
          textAnswer: 'went',
          timeSpent: 10
        }
      ]
    };

    const submitResponse = await axios.post(`${BASE_URL}/questionnaires/${newQuestionnaireId}/submit`, testAnswers, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Package-ID': PACKAGE_ID,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Test submission successful!');
    console.log('📊 Results:', {
      score: submitResponse.data.data.score,
      passed: submitResponse.data.data.passed,
      correctAnswers: submitResponse.data.data.correctAnswers,
      totalQuestions: submitResponse.data.data.totalQuestions,
      feedback: submitResponse.data.data.feedback
    });

    console.log('\n📝 Step 4: Get questionnaire results');
    const resultsResponse = await axios.get(`${BASE_URL}/questionnaires/${newQuestionnaireId}/results`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'X-Package-ID': PACKAGE_ID
      }
    });

    console.log('✅ Results retrieved successfully!');
    console.log('📊 Detailed results:', {
      score: resultsResponse.data.data.score,
      passed: resultsResponse.data.data.passed,
      answersCount: resultsResponse.data.data.answers.length
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAdminQuestionnaireCreation();
