const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const LearningModule = require('./models/LearningModule');
const TextContent = require('./models/TextContent');
const { getPackageFilter } = require('./config/packages');

async function debugSingleModuleStepByStep() {
  try {
    console.log('🔍 Step-by-step debugging of single module endpoint logic...');
    
    const moduleId = '6883c177396dff8afa49a488';
    const packageId = 'com.gumbo.english';
    const packageFilter = getPackageFilter(packageId);
    
    console.log('1️⃣ Package filter:', packageFilter);
    
    // Step 1: Find the module
    console.log('\n2️⃣ Finding module...');
    const module = await LearningModule.findOne({
      _id: moduleId,
      ...packageFilter
    })
      .populate('topic', 'title slug')
      .populate('prerequisites', 'title slug')
      .populate('createdBy', 'name');
    
    if (!module) {
      console.log('❌ Module not found');
      return;
    }
    
    console.log(`✅ Module found: "${module.title}"`);
    console.log(`Is active: ${module.isActive}`);
    
    // Step 2: Check if module is active
    if (!module.isActive) {
      console.log('❌ Module is not active');
      return;
    }
    
    // Step 3: Test hasAccess method
    console.log('\n3️⃣ Testing hasAccess method...');
    try {
      const hasAccess = module.hasAccess(null); // No user
      console.log(`✅ hasAccess (no user): ${hasAccess}`);
      module._doc.hasAccess = hasAccess;
    } catch (accessError) {
      console.log('❌ Error in hasAccess:', accessError.message);
      return;
    }
    
    // Step 4: Test content population
    console.log('\n4️⃣ Testing content population...');
    const populatedContent = [];
    
    for (let i = 0; i < module.content.length; i++) {
      const contentItem = module.content[i];
      console.log(`\n  📝 Content item ${i + 1}:`);
      console.log(`    Type: ${contentItem.contentType}`);
      console.log(`    ID: ${contentItem.contentId}`);
      console.log(`    Model: ${contentItem.contentModel}`);
      
      try {
        let contentData = null;
        
        if (['text', 'summary', 'reading', 'instructions', 'notes', 'explanation'].includes(contentItem.contentType)) {
          contentData = await TextContent.findOne({
            _id: contentItem.contentId,
            ...packageFilter,
            isActive: true
          }).select('title slug contentType content estimatedReadingTime isPremium metadata');
          
          if (contentData) {
            console.log(`    ✅ Found: "${contentData.title}"`);
            populatedContent.push({
              ...contentItem.toObject(),
              contentData
            });
          } else {
            console.log(`    ❌ Not found`);
          }
        }
      } catch (contentError) {
        console.log(`    ❌ Error: ${contentError.message}`);
        return;
      }
    }
    
    console.log(`\n✅ Population successful: ${populatedContent.length}/${module.content.length} items`);
    module._doc.populatedContent = populatedContent;
    
    // Step 5: Test getUserProgress (without user)
    console.log('\n5️⃣ Testing getUserProgress (skipped - no user)...');
    // Skip this since we don't have a user
    
    // Step 6: Test response serialization
    console.log('\n6️⃣ Testing response serialization...');
    try {
      const responseData = {
        success: true,
        data: module
      };
      
      // Try to serialize to JSON (this is what res.json() does)
      const jsonString = JSON.stringify(responseData);
      console.log(`✅ JSON serialization successful (${jsonString.length} characters)`);
      
      // Parse it back to make sure it's valid
      const parsed = JSON.parse(jsonString);
      console.log(`✅ JSON parsing successful`);
      console.log(`Module title in parsed data: "${parsed.data.title}"`);
      console.log(`Populated content count: ${parsed.data.populatedContent ? parsed.data.populatedContent.length : 'null'}`);
      
    } catch (serializationError) {
      console.log('❌ JSON serialization error:', serializationError.message);
      console.log('Error stack:', serializationError.stack);
      return;
    }
    
    console.log('\n🎉 All steps completed successfully!');
    console.log('The single module endpoint logic should work fine.');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

debugSingleModuleStepByStep();
