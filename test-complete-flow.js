const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testCompleteFlow() {
  try {
    console.log('🔐 Step 1: Admin Login');
    
    // Step 1: Login as admin to get token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
      username: 'superadmin',
      password: 'superadmin@123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token obtained');

    // Step 2: Get text content to use in learning module
    console.log('\n📚 Step 2: Fetching text content');
    
    const textContentResponse = await axios.get(`${BASE_URL}/api/admin/text-content`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Package-ID': 'com.gumbo.english'
      }
    });

    if (!textContentResponse.data.success || textContentResponse.data.data.length === 0) {
      throw new Error('No text content found');
    }

    const textContent = textContentResponse.data.data[0];
    console.log(`✅ Found text content: "${textContent.title}" (ID: ${textContent._id})`);

    // Step 3: Get topics to use in learning module
    console.log('\n🏷️ Step 3: Fetching topics');
    
    const topicsResponse = await axios.get(`${BASE_URL}/api/admin/topics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Package-ID': 'com.gumbo.english'
      }
    });

    if (!topicsResponse.data.success || topicsResponse.data.data.length === 0) {
      throw new Error('No topics found');
    }

    const topic = topicsResponse.data.data[0];
    console.log(`✅ Found topic: "${topic.title}" (ID: ${topic._id})`);

    // Step 4: Create learning module with text content
    console.log('\n📖 Step 4: Creating learning module with text content');
    
    const moduleData = {
      title: "Test Text Learning Module",
      description: "A test module with text content created via API",
      topic: topic._id,
      difficulty: "beginner",
      classNumber: 1,
      isPremium: false,
      content: [
        {
          contentType: "text",
          contentId: textContent._id,
          contentModel: "TextContent",
          title: textContent.title,
          order: 0,
          isRequired: true
        }
      ]
    };

    console.log('Module data to be sent:', JSON.stringify(moduleData, null, 2));

    const createModuleResponse = await axios.post(`${BASE_URL}/api/admin/learning-modules`, moduleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Package-ID': 'com.gumbo.english',
        'Content-Type': 'application/json'
      }
    });

    if (createModuleResponse.data.success) {
      console.log('✅ Learning module created successfully!');
      console.log('Module details:', JSON.stringify(createModuleResponse.data.data, null, 2));
    } else {
      console.log('❌ Learning module creation failed:', createModuleResponse.data.message);
      if (createModuleResponse.data.errors) {
        console.log('Validation errors:', createModuleResponse.data.errors);
      }
    }

  } catch (error) {
    console.error('❌ Error in test flow:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full Error:', error.message);
  }
}

testCompleteFlow();
