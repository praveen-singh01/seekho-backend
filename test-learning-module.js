const axios = require('axios');

// Test creating a learning module with text content
async function testCreateLearningModule() {
  try {
    // First, let's get a valid admin token (you'll need to replace this with actual login)
    console.log('Testing learning module creation...');
    
    // Sample learning module data with text content
    const moduleData = {
      title: "Test Text Module",
      description: "A test module with text content",
      topic: "687e8635f132c7fb7db172f2", // Basic Tenses topic ID from earlier
      difficulty: "beginner",
      classNumber: 1,
      isPremium: false,
      content: [
        {
          contentType: "text",
          contentId: "687e8cb9822a95065d577063", // Present Tense Summary ID from earlier
          contentModel: "TextContent",
          title: "Present Tense Summary",
          order: 0,
          isRequired: true
        }
      ]
    };

    console.log('Module data:', JSON.stringify(moduleData, null, 2));

    // Make the API call
    const response = await axios.post('http://localhost:8000/api/admin/learning-modules', moduleData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Package-ID': 'com.gumbo.english',
        // Note: In real scenario, you'd need a valid admin token
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Full Error:', error.message);
  }
}

testCreateLearningModule();
