const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function debugModuleContent() {
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
    
    console.log(`\n📚 Step 2: Fetching module ${moduleId} (Admin API)`);
    
    try {
      const adminModuleResponse = await axios.get(`${BASE_URL}/api/admin/learning-modules`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'X-Package-ID': 'com.gumbo.english'
        }
      });

      const module = adminModuleResponse.data.data.find(m => m._id === moduleId);
      if (module) {
        console.log(`✅ Found module: "${module.title}"`);
        console.log(`Content items: ${module.content.length}`);
        console.log('Content details:', JSON.stringify(module.content, null, 2));
      } else {
        console.log(`❌ Module ${moduleId} not found in admin API`);
      }
    } catch (error) {
      console.log(`❌ Admin API error:`, error.message);
    }

    console.log(`\n📱 Step 3: Testing Flutter API endpoint`);
    
    // Test the public learning modules API (what Flutter app uses)
    try {
      const publicModulesResponse = await axios.get(`${BASE_URL}/api/learning-modules`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`, // Using admin token for testing
          'X-Package-ID': 'com.gumbo.english'
        }
      });

      console.log(`✅ Public API returned ${publicModulesResponse.data.data.length} modules`);
      
      const publicModule = publicModulesResponse.data.data.find(m => m._id === moduleId);
      if (publicModule) {
        console.log(`✅ Found module in public API: "${publicModule.title}"`);
        console.log(`Content items: ${publicModule.content ? publicModule.content.length : 'NULL'}`);
        console.log('Content details:', JSON.stringify(publicModule.content, null, 2));
      } else {
        console.log(`❌ Module ${moduleId} not found in public API`);
      }
    } catch (error) {
      console.log(`❌ Public API error:`, error.response?.status, error.response?.data?.message || error.message);
    }

    console.log(`\n🔍 Step 4: Testing single module fetch`);
    
    // Test fetching single module (if endpoint exists)
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
        console.log('Content details:', JSON.stringify(singleModuleResponse.data.data.content, null, 2));
      }
    } catch (error) {
      console.log(`❌ Single module fetch error:`, error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error in debug:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

debugModuleContent();
