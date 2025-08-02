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
  console.log('📱 Package ID:', PACKAGE_ID);
  console.log('🎫 Google ID Token length:', GOOGLE_ID_TOKEN.length);

  const result = await makeRequest('POST', '/api/auth/android/google', {
    idToken: GOOGLE_ID_TOKEN,
  });

  console.log('📊 Auth result status:', result.status);
  console.log('📊 Auth result success:', result.success);

  if (result.success) {
    // Extract token from nested data structure
    authToken = result.data.data?.token || result.data.token;
    console.log('✅ Authentication successful');

    // Safely access user data
    const userData = result.data.data?.user || result.data.user;
    if (userData) {
      console.log(`📱 User: ${userData.name || 'Unknown'} (${userData.email || 'Unknown'})`);
    }

    if (authToken) {
      console.log(`🎫 Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('⚠️ No token received');
      console.log('📊 Full response:', JSON.stringify(result.data, null, 2));
      return false;
    }
  } else {
    console.log('❌ Authentication failed:', result.error);
    console.log('📊 Full response:', JSON.stringify(result, null, 2));
    return false;
  }
};

const testProgressRecord = async () => {
  console.log('\n🎯 Testing Progress Recording...');
  
  const result = await makeRequest('POST', '/api/progress/record', {
    contentId: '507f1f77bcf86cd799439011',
    contentType: 'video',
    progressPercentage: 75,
    timeSpent: 1200,
    status: 'inProgress',
    metadata: {
      moduleId: '507f1f77bcf86cd799439012',
      contentTitle: 'Introduction to JavaScript',
    },
  });

  if (result.success) {
    console.log('✅ Progress recording successful');
    console.log(`📊 Progress ID: ${result.data.data.progressId}`);
  } else {
    console.log('❌ Progress recording failed:', result.error);
  }
  
  return result.success;
};

const testBulkProgress = async () => {
  console.log('\n📊 Testing Bulk Progress Retrieval...');
  
  const result = await makeRequest('GET', '/api/progress/bulk?contentIds=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012');

  if (result.success) {
    console.log('✅ Bulk progress retrieval successful');
    console.log(`📈 Progress data:`, Object.keys(result.data.data).length, 'items');
  } else {
    console.log('❌ Bulk progress retrieval failed:', result.error);
  }
  
  return result.success;
};

const testUserStats = async () => {
  console.log('\n📈 Testing User Statistics...');
  
  const result = await makeRequest('GET', '/api/users/stats/detailed');

  if (result.success) {
    console.log('✅ User statistics retrieval successful');
    console.log(`📊 Videos watched: ${result.data.data.videosWatched || 0}`);
    console.log(`⏱️  Total watch time: ${result.data.data.totalWatchTime || 0}s`);
    console.log(`🔥 Current streak: ${result.data.data.currentStreak || 0}`);
  } else {
    console.log('❌ User statistics retrieval failed:', result.error);
  }
  
  return result.success;
};

const testStatsUpdate = async () => {
  console.log('\n📊 Testing Stats Update...');
  
  const result = await makeRequest('POST', '/api/users/stats/update', {
    activityType: 'video_watched',
    contentId: '507f1f77bcf86cd799439011',
    contentType: 'video',
    timeSpent: 1200,
  });

  if (result.success) {
    console.log('✅ Stats update successful');
    console.log(`🔥 Current streak: ${result.data.data.currentStreak}`);
  } else {
    console.log('❌ Stats update failed:', result.error);
  }
  
  return result.success;
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Starting Enhanced Features API Tests');
  console.log('=====================================');

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Progress Recording', fn: testProgressRecord },
    { name: 'Bulk Progress', fn: testBulkProgress },
    { name: 'User Statistics', fn: testUserStats },
    { name: 'Stats Update', fn: testStatsUpdate },
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
    console.log('\n🎉 All tests passed! Enhanced features are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
};

// Run the tests
runTests().catch(console.error);
