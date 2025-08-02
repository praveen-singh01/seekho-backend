#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const PACKAGE_ID = 'com.gumbo.learning';
const GOOGLE_ID_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyNzEwMzgiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiIxMjM0NTY3ODkwMTIzNDU2Nzg5MDEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0LnVzZXJAZ21haWwuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdoVF9leGFtcGxlIiwiaXNzIjoiYWNjb3VudHMuZ29vZ2xlLmNvbSIsImF1ZCI6IjYwMTg5MDI0NTI3OC04Ym03NXZoY3RsM3VkaWpjZjN1ajFrbWRybTg0OGtyci5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImlhdCI6MTc1NDExMTI1OCwiZXhwIjoxNzU0MTE0ODU4LCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZ2l2ZW5fbmFtZSI6IlRlc3QiLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJsb2NhbGUiOiJlbiJ9.ZHVtbXlfc2lnbmF0dXJlX2Zvcl90ZXN0aW5n';

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Package-ID': PACKAGE_ID,
      },
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
};

// Test functions
const testAuthentication = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  const result = await makeRequest('POST', '/api/auth/android/google', {
    idToken: GOOGLE_ID_TOKEN,
  });

  if (result.success) {
    authToken = result.data.data?.token || result.data.token;
    console.log('✅ Authentication successful');
    const userData = result.data.data?.user || result.data.user;
    if (userData) {
      console.log(`📱 User: ${userData.name || 'Unknown'} (${userData.email || 'Unknown'})`);
    }
    return true;
  } else {
    console.log('❌ Authentication failed:', result.error);
    return false;
  }
};

const testVideoShare = async () => {
  console.log('\n🎬 Testing Video Share...');
  
  const result = await makeRequest('POST', '/api/videos/507f1f77bcf86cd799439011/share', {
    platform: 'whatsapp',
    message: 'Check out this amazing video!',
  });

  if (result.success) {
    console.log('✅ Video share successful');
    console.log(`🔗 Share URL: ${result.data.data.shareUrl}`);
  } else {
    console.log('❌ Video share failed:', result.error);
  }
  
  return result.success;
};

const testVideoComments = async () => {
  console.log('\n💬 Testing Video Comments...');
  
  // Test getting comments
  const getResult = await makeRequest('GET', '/api/videos/507f1f77bcf86cd799439011/comments?page=1&limit=10');

  if (getResult.success) {
    console.log('✅ Get video comments successful');
    console.log(`📊 Comments found: ${getResult.data.data.comments.length}`);
  } else {
    console.log('❌ Get video comments failed:', getResult.error);
    return false;
  }

  // Test adding a comment
  const addResult = await makeRequest('POST', '/api/videos/507f1f77bcf86cd799439011/comments', {
    content: 'This is a test comment from the API test!',
  });

  if (addResult.success) {
    console.log('✅ Add video comment successful');
    console.log(`💬 Comment ID: ${addResult.data.data.id || addResult.data.data._id}`);
  } else {
    console.log('❌ Add video comment failed:', addResult.error);
  }
  
  return getResult.success && addResult.success;
};

const testVideoFavorite = async () => {
  console.log('\n❤️ Testing Video Favorite...');
  
  const result = await makeRequest('POST', '/api/videos/507f1f77bcf86cd799439011/favorite');

  if (result.success) {
    console.log('✅ Video favorite toggle successful');
    console.log(`❤️ Is favorite: ${result.data.data.isFavorite}`);
    console.log(`📊 Total favorites: ${result.data.data.totalFavorites}`);
  } else {
    console.log('❌ Video favorite toggle failed:', result.error);
  }
  
  return result.success;
};

const testVideoBookmark = async () => {
  console.log('\n🔖 Testing Video Bookmark...');
  
  // Test adding bookmark
  const addResult = await makeRequest('POST', '/api/videos/507f1f77bcf86cd799439011/bookmark', {
    note: 'Important concept explained here',
    timestamp: 450,
  });

  if (addResult.success) {
    console.log('✅ Add video bookmark successful');
    console.log(`🔖 Bookmark ID: ${addResult.data.data.id || addResult.data.data._id}`);
  } else {
    console.log('❌ Add video bookmark failed:', addResult.error);
    return false;
  }

  // Test removing bookmark
  const removeResult = await makeRequest('DELETE', '/api/videos/507f1f77bcf86cd799439011/bookmark');

  if (removeResult.success) {
    console.log('✅ Remove video bookmark successful');
  } else {
    console.log('❌ Remove video bookmark failed:', removeResult.error);
  }
  
  return addResult.success && removeResult.success;
};

// Main test runner
const runTests = async () => {
  console.log('🎬 Starting Video Social Features API Tests');
  console.log('==========================================');

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Video Share', fn: testVideoShare },
    { name: 'Video Comments', fn: testVideoComments },
    { name: 'Video Favorite', fn: testVideoFavorite },
    { name: 'Video Bookmark', fn: testVideoBookmark },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test crashed:`, error.message);
      failed++;
    }
  }

  console.log('\n📋 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All video social features tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
};

// Run the tests
runTests().catch(console.error);
