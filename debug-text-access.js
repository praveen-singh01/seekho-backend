const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function debugTextContentAccess() {
  try {
    console.log('🔐 Step 1: Admin Login (to check content properties)');
    
    // Login as admin to check content properties
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
      username: 'superadmin',
      password: 'superadmin@123'
    });

    const adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // Text content IDs to check
    const contentIds = [
      '687e8cb9822a95065d577063', // Summary
      '687e8cb9822a95065d577068', // Reading
      '687e8cba822a95065d57706e', // Instructions
      '687e8cba822a95065d577073', // Notes
    ];

    console.log('\n📚 Step 2: Checking content properties (Admin view)');
    
    for (const contentId of contentIds) {
      try {
        const response = await axios.get(`${BASE_URL}/api/admin/text-content`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Package-ID': 'com.gumbo.english'
          }
        });

        const content = response.data.data.find(item => item._id === contentId);
        if (content) {
          console.log(`\n--- Content: ${content.title} ---`);
          console.log(`ID: ${contentId}`);
          console.log(`isPremium: ${content.isPremium}`);
          console.log(`isActive: ${content.isActive}`);
          console.log(`contentType: ${content.contentType}`);
        } else {
          console.log(`❌ Content ${contentId} not found`);
        }
      } catch (error) {
        console.log(`❌ Error fetching content ${contentId}:`, error.message);
      }
    }

    console.log('\n👤 Step 3: Testing with user access (Public API)');
    
    // Test public API access (without user authentication)
    for (const contentId of contentIds) {
      try {
        console.log(`\n--- Testing public access for ${contentId} ---`);
        
        const response = await axios.get(`${BASE_URL}/api/text-content/${contentId}`, {
          headers: {
            'X-Package-ID': 'com.gumbo.english'
            // No Authorization header = no user
          }
        });

        if (response.data.success) {
          console.log(`✅ Content accessible: ${response.data.data.title}`);
          console.log(`hasAccess: ${response.data.data.hasAccess}`);
          console.log(`isPremium: ${response.data.data.isPremium}`);
        }
      } catch (error) {
        console.log(`❌ Access denied: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    console.log('\n🔑 Step 4: Testing with authenticated user');
    
    // For this test, we'll use admin token as user token (just for testing)
    // In real scenario, you'd get a user token from Google OAuth
    for (const contentId of contentIds) {
      try {
        console.log(`\n--- Testing authenticated access for ${contentId} ---`);
        
        const response = await axios.get(`${BASE_URL}/api/text-content/${contentId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`, // Using admin token as user token for test
            'X-Package-ID': 'com.gumbo.english'
          }
        });

        if (response.data.success) {
          console.log(`✅ Content accessible: ${response.data.data.title}`);
          console.log(`hasAccess: ${response.data.data.hasAccess}`);
          console.log(`isPremium: ${response.data.data.isPremium}`);
        }
      } catch (error) {
        console.log(`❌ Access denied: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in debug:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

debugTextContentAccess();
