const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testGetLearningModules() {
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

    // Step 2: Get all learning modules
    console.log('\n📚 Step 2: Fetching all learning modules');
    
    const modulesResponse = await axios.get(`${BASE_URL}/api/admin/learning-modules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Package-ID': 'com.gumbo.english'
      }
    });

    if (!modulesResponse.data.success) {
      throw new Error('Failed to fetch modules: ' + modulesResponse.data.message);
    }

    const modules = modulesResponse.data.data;
    console.log(`✅ Found ${modules.length} learning modules`);

    // Step 3: Analyze modules for text content
    console.log('\n🔍 Step 3: Analyzing modules for text/summary content');
    
    let modulesWithTextContent = 0;
    let totalTextContentItems = 0;

    modules.forEach((module, index) => {
      console.log(`\n--- Module ${index + 1}: "${module.title}" ---`);
      console.log(`ID: ${module._id}`);
      console.log(`Content items: ${module.content.length}`);
      
      let hasTextContent = false;
      module.content.forEach((contentItem, contentIndex) => {
        console.log(`  Content ${contentIndex + 1}: ${contentItem.contentType} (${contentItem.contentModel})`);
        
        if (['text', 'summary', 'reading', 'instructions', 'notes', 'explanation'].includes(contentItem.contentType)) {
          hasTextContent = true;
          totalTextContentItems++;
          console.log(`    ✅ TEXT CONTENT FOUND: ${contentItem.contentType}`);
        }
      });
      
      if (hasTextContent) {
        modulesWithTextContent++;
        console.log(`  🎯 This module contains text content!`);
      }
    });

    console.log('\n📊 Summary:');
    console.log(`Total modules: ${modules.length}`);
    console.log(`Modules with text content: ${modulesWithTextContent}`);
    console.log(`Total text content items: ${totalTextContentItems}`);

    // Step 4: Test fetching a specific module if any exist
    if (modules.length > 0) {
      console.log('\n🔍 Step 4: Testing single module fetch');
      
      const firstModule = modules[0];
      const singleModuleResponse = await axios.get(`${BASE_URL}/api/admin/learning-modules/${firstModule._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Package-ID': 'com.gumbo.english'
        }
      });

      if (singleModuleResponse.data.success) {
        console.log(`✅ Successfully fetched single module: "${singleModuleResponse.data.data.title}"`);
        console.log(`Content items in detail:`, JSON.stringify(singleModuleResponse.data.data.content, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error in test:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full Error:', error.message);
  }
}

testGetLearningModules();
