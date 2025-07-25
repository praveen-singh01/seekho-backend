const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TextContent = require('./models/TextContent');
const { getPackageFilter } = require('./config/packages');

async function debugTextContent() {
  try {
    console.log('🔍 Debugging text content for specific IDs...');
    
    const contentIds = [
      '687e8cba822a95065d57706e',
      '687e8cba822a95065d577073'
    ];
    
    const packageFilter = getPackageFilter('com.gumbo.english');
    console.log('Package filter:', packageFilter);
    
    for (const contentId of contentIds) {
      console.log(`\n📝 Checking content ID: ${contentId}`);
      
      try {
        const content = await TextContent.findOne({
          _id: contentId,
          ...packageFilter,
          isActive: true
        });
        
        if (content) {
          console.log(`✅ Found content: "${content.title}"`);
          console.log(`Content type: ${content.contentType}`);
          console.log(`Is active: ${content.isActive}`);
          console.log(`Package ID: ${content.packageId}`);
          console.log('Content keys:', Object.keys(content.toObject()));
        } else {
          console.log(`❌ Content not found or not active`);
          
          // Check if it exists without filters
          const anyContent = await TextContent.findOne({ _id: contentId });
          if (anyContent) {
            console.log(`⚠️  Content exists but doesn't match filters:`);
            console.log(`   Package ID: ${anyContent.packageId}`);
            console.log(`   Is active: ${anyContent.isActive}`);
            console.log('   Content keys:', Object.keys(anyContent.toObject()));
          } else {
            console.log(`❌ Content doesn't exist at all`);
          }
        }
      } catch (error) {
        console.log(`❌ Error fetching content ${contentId}:`, error.message);
      }
    }
    
    console.log('\n🔍 Checking all text content for this package...');
    const allContent = await TextContent.find(packageFilter).select('title contentType isActive');
    console.log(`Found ${allContent.length} text content items for this package`);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugTextContent();
