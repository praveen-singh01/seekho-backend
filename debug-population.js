const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const LearningModule = require('./models/LearningModule');
const TextContent = require('./models/TextContent');
const { getPackageFilter } = require('./config/packages');

async function debugPopulation() {
  try {
    console.log('🔍 Debugging learning module population...');
    
    const moduleId = '6883c177396dff8afa49a488';
    const packageFilter = getPackageFilter('com.gumbo.english');
    
    console.log('Package filter:', packageFilter);
    
    // Get the module
    const module = await LearningModule.findOne({
      _id: moduleId,
      ...packageFilter
    });
    
    if (!module) {
      console.log('❌ Module not found');
      return;
    }
    
    console.log(`✅ Found module: "${module.title}"`);
    console.log(`Content items: ${module.content.length}`);
    
    // Test the population logic manually
    console.log('\n🔍 Testing manual population...');
    const populatedContent = [];
    
    for (let contentItem of module.content) {
      console.log(`\n📝 Processing content item:`);
      console.log(`  Type: ${contentItem.contentType}`);
      console.log(`  ID: ${contentItem.contentId}`);
      console.log(`  Model: ${contentItem.contentModel}`);
      
      let contentData = null;
      
      try {
        switch (contentItem.contentType) {
          case 'text':
          case 'summary':
          case 'reading':
          case 'instructions':
          case 'notes':
          case 'explanation':
            console.log(`  🔍 Fetching TextContent...`);
            contentData = await TextContent.findOne({
              _id: contentItem.contentId,
              ...packageFilter,
              isActive: true
            }).select('title slug contentType estimatedReadingTime isPremium metadata contentPreview wordCount');
            
            if (contentData) {
              console.log(`  ✅ Found: "${contentData.title}"`);
              console.log(`  Content type: ${contentData.contentType}`);
              console.log(`  Package ID: ${contentData.packageId}`);
              console.log(`  Is active: ${contentData.isActive}`);
            } else {
              console.log(`  ❌ Not found with filters`);
              
              // Try without isActive filter
              const anyContent = await TextContent.findOne({
                _id: contentItem.contentId,
                ...packageFilter
              });
              
              if (anyContent) {
                console.log(`  ⚠️  Found without isActive filter:`);
                console.log(`     Is active: ${anyContent.isActive}`);
                console.log(`     Package ID: ${anyContent.packageId}`);
              }
            }
            break;
        }

        if (contentData) {
          populatedContent.push({
            ...contentItem.toObject(),
            contentData
          });
        }
      } catch (err) {
        console.error(`  ❌ Error populating content ${contentItem.contentId}:`, err.message);
        console.error(`  Stack:`, err.stack);
      }
    }
    
    console.log(`\n📊 Population results:`);
    console.log(`Original content items: ${module.content.length}`);
    console.log(`Populated content items: ${populatedContent.length}`);
    
    if (populatedContent.length > 0) {
      console.log('\n✅ Populated content:');
      populatedContent.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.contentData.title} (${item.contentType})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

debugPopulation();
