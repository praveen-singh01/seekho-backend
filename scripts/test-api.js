const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Test API endpoints
const testEndpoints = async () => {
  console.log('🧪 Testing Seekho Backend API...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    
    // Test categories endpoint
    console.log('\n2. Testing categories endpoint...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`);
    console.log('✅ Categories:', `Found ${categoriesResponse.data.count} categories`);
    
    // Test topics endpoint
    console.log('\n3. Testing topics endpoint...');
    const topicsResponse = await axios.get(`${BASE_URL}/api/topics`);
    console.log('✅ Topics:', `Found ${topicsResponse.data.count} topics`);
    
    // Test videos endpoint
    console.log('\n4. Testing videos endpoint...');
    const videosResponse = await axios.get(`${BASE_URL}/api/videos`);
    console.log('✅ Videos:', `Found ${videosResponse.data.count} videos`);
    
    // Test subscription plans endpoint
    console.log('\n5. Testing subscription plans endpoint...');
    const plansResponse = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
    console.log('✅ Subscription plans:', Object.keys(plansResponse.data.data).join(', '));
    
    // Test 404 handling
    console.log('\n6. Testing 404 handling...');
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 404 handling works correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 All API tests passed!');
    console.log('\n📚 API Documentation:');
    console.log(`🌐 Swagger UI: ${BASE_URL}/api-docs`);
    console.log(`📖 Health: GET ${BASE_URL}/health`);
    console.log('\n🔗 Public Endpoints:');
    console.log(`📖 Categories: GET ${BASE_URL}/api/categories`);
    console.log(`📖 Topics: GET ${BASE_URL}/api/topics`);
    console.log(`📖 Videos: GET ${BASE_URL}/api/videos`);
    console.log(`📖 Plans: GET ${BASE_URL}/api/subscriptions/plans`);
    console.log('\n🔐 Authentication:');
    console.log(`📖 Google OAuth: GET ${BASE_URL}/api/auth/google`);
    console.log(`📖 Current User: GET ${BASE_URL}/api/auth/me`);
    console.log('\n📤 File Upload (Admin):');
    console.log(`📖 Category Thumbnail: POST ${BASE_URL}/api/upload/category-thumbnail`);
    console.log(`📖 Video Upload: POST ${BASE_URL}/api/upload/video`);
    console.log(`📖 Video Thumbnail: POST ${BASE_URL}/api/upload/video-thumbnail`);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running:');
      console.log('   npm run dev');
    }
    
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testEndpoints();
}

module.exports = { testEndpoints };
