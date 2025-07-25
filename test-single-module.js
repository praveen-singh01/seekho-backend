const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testSingleModule() {
  try {
    console.log('🔐 Step 1: Admin Login');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
      username: 'superadmin',
      password: 'superadmin@123'
    });

    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // Test the specific module ID from Flutter logs
    const moduleId = '6883c177396dff8afa49a488';
    
    console.log(`\n🔍 Testing single module fetch with detailed error logging`);
    
    try {
      const singleModuleResponse = await axios.get(`${BASE_URL}/api/learning-modules/${moduleId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'X-Package-ID': 'com.gumbo.english'
        }
      });

      if (singleModuleResponse.data.success) {
        console.log(`✅ Single module fetch successful: "${singleModuleResponse.data.data.title}"`);
        console.log(`Content items: ${singleModuleResponse.data.data.content ? singleModuleResponse.data.data.content.length : 'NULL'}`);
        console.log(`Populated content: ${singleModuleResponse.data.data.populatedContent ? singleModuleResponse.data.data.populatedContent.length : 'NULL'}`);
        
        if (singleModuleResponse.data.data.populatedContent) {
          console.log('Populated content details:', JSON.stringify(singleModuleResponse.data.data.populatedContent, null, 2));
        }
      }
    } catch (error) {
      console.log(`❌ Single module fetch error:`, error.response?.status);
      console.log('Error message:', error.response?.data?.message || error.message);
      console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response?.status === 500) {
        console.log('\n🔍 This is a server error. Check the server logs for more details.');
      }
    }

  } catch (error) {
    console.error('❌ Error in test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testSingleModule();
