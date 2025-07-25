const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';
const QUESTIONNAIRE_ID = '687e8636f132c7fb7db172fc';
const PACKAGE_ID = 'com.gumbo.english';

async function testQuestionnaireSubmission() {
  try {
    console.log('🔐 Step 1: Admin Login');
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
      username: 'superadmin',
      password: 'superadmin@123'
    });

    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin login successful');
    console.log('🔍 Token structure:', loginResponse.data.data);

    console.log('\n📝 Step 2: Get questionnaire details');
    const questionnaireResponse = await axios.get(`${BASE_URL}/questionnaires/${QUESTIONNAIRE_ID}`, {
      headers: {
        'X-Package-ID': PACKAGE_ID,
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const questionnaire = questionnaireResponse.data.data;
    console.log(`✅ Found questionnaire: "${questionnaire.title}"`);
    console.log(`📊 Total questions: ${questionnaire.questions.length}`);
    
    questionnaire.questions.forEach((q, index) => {
      console.log(`   ${index + 1}. ${q.questionText} (${q.questionType})`);
    });

    console.log('\n📤 Step 3: Submit questionnaire answers');
    const answers = [
      {
        questionIndex: 0,
        textAnswer: 'goes',
        timeSpent: 30
      },
      {
        questionIndex: 1,
        textAnswer: 'I am reading a book right now.',
        timeSpent: 45
      }
    ];

    console.log('📝 Submitting answers:');
    answers.forEach((answer, index) => {
      console.log(`   Question ${answer.questionIndex + 1}: "${answer.textAnswer}"`);
    });

    const submissionResponse = await axios.post(`${BASE_URL}/questionnaires/${QUESTIONNAIRE_ID}/submit`, {
      answers: answers
    }, {
      headers: {
        'X-Package-ID': PACKAGE_ID,
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Submission successful!');
    console.log('📊 Results:', JSON.stringify(submissionResponse.data.data, null, 2));

    console.log('\n📊 Step 4: Get questionnaire results');
    const resultsResponse = await axios.get(`${BASE_URL}/questionnaires/${QUESTIONNAIRE_ID}/results`, {
      headers: {
        'X-Package-ID': PACKAGE_ID,
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✅ Results retrieved!');
    console.log('📊 Full results:', JSON.stringify(resultsResponse.data.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testQuestionnaireSubmission();
