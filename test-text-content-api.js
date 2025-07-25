const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testTextContentAPI() {
  try {
    console.log('🔐 Step 1: Admin Login');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
      username: 'superadmin',
      password: 'superadmin@123'
    });

    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // Test the specific text content ID from your curl command
    const textContentId = '687e8cb9822a95065d577063';
    
    console.log(`\n📝 Testing text content API: ${textContentId}`);
    
    try {
      const response = await axios.get(`${BASE_URL}/api/text-content/${textContentId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'X-Package-ID': 'com.gumbo.english'
        }
      });

      if (response.data.success) {
        console.log(`✅ Text content API successful`);
        console.log(`Title: "${response.data.data.title}"`);
        console.log(`Has access: ${response.data.data.hasAccess}`);
        console.log(`Content type: ${response.data.data.contentType}`);
        console.log(`Package ID: ${response.data.data.packageId}`);
        console.log(`Is active: ${response.data.data.isActive}`);
        console.log(`Content preview: ${response.data.data.contentPreview ? response.data.data.contentPreview.substring(0, 100) + '...' : 'N/A'}`);
      }
    } catch (error) {
      console.log(`❌ Text content API error:`, error.response?.status);
      console.log('Error message:', error.response?.data?.message || error.message);
      console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Also test the other content IDs from the learning module
    const otherContentIds = [
      '687e8cba822a95065d57706e', // "How to Form Present Continuous"
      '687e8cba822a95065d577073'  // "Present Tense Key Points"
    ];

    for (const contentId of otherContentIds) {
      console.log(`\n📝 Testing text content API: ${contentId}`);
      
      try {
        const response = await axios.get(`${BASE_URL}/api/text-content/${contentId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Package-ID': 'com.gumbo.english'
          }
        });

        if (response.data.success) {
          console.log(`✅ Text content API successful`);
          console.log(`Title: "${response.data.data.title}"`);
          console.log(`Has access: ${response.data.data.hasAccess}`);
          console.log(`Content type: ${response.data.data.contentType}`);
        }
      } catch (error) {
        console.log(`❌ Text content API error:`, error.response?.status);
        console.log('Error message:', error.response?.data?.message || error.message);
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

testTextContentAPI();
