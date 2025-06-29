const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

async function testPackageFiltering() {
  try {
    console.log('🧪 Testing package filtering for categories...');
    
    // Clean up any existing test categories
    await Category.deleteMany({ name: { $regex: /^Test Category/ } });
    
    // Create test categories for both packages
    const seekhoCategory = await Category.create({
      packageId: 'com.gumbo.learning',
      name: 'Test Category Seekho',
      description: 'Test category for Seekho app',
      color: '#007bff',
      order: 999,
      isActive: true
    });
    
    const boloCategory = await Category.create({
      packageId: 'com.gumbo.english',
      name: 'Test Category Bolo',
      description: 'Test category for Bolo app',
      color: '#28a745',
      order: 999,
      isActive: true
    });
    
    console.log('✅ Created test categories:');
    console.log('  - Seekho category:', seekhoCategory._id);
    console.log('  - Bolo category:', boloCategory._id);
    
    // Test API calls
    console.log('\n🔍 Testing API filtering...');
    
    // Test 1: Get categories for Seekho app
    console.log('\n1. Testing Seekho app (com.gumbo.learning):');
    const seekhoResponse = await fetch('http://localhost:8000/api/categories', {
      headers: {
        'Content-Type': 'application/json',
        'X-Package-ID': 'com.gumbo.learning'
      }
    });
    const seekhoData = await seekhoResponse.json();
    console.log('   Categories found:', seekhoData.count);
    const seekhoTestCategory = seekhoData.data.find(cat => cat.name === 'Test Category Seekho');
    const boloTestCategoryInSeekhoo = seekhoData.data.find(cat => cat.name === 'Test Category Bolo');
    console.log('   Contains Seekho test category:', !!seekhoTestCategory);
    console.log('   Contains Bolo test category:', !!boloTestCategoryInSeekhoo);
    
    // Test 2: Get categories for Bolo app
    console.log('\n2. Testing Bolo app (com.gumbo.english):');
    const boloResponse = await fetch('http://localhost:8000/api/categories', {
      headers: {
        'Content-Type': 'application/json',
        'X-Package-ID': 'com.gumbo.english'
      }
    });
    const boloData = await boloResponse.json();
    console.log('   Categories found:', boloData.count);
    const boloTestCategory = boloData.data.find(cat => cat.name === 'Test Category Bolo');
    const seekhoTestCategoryInBolo = boloData.data.find(cat => cat.name === 'Test Category Seekho');
    console.log('   Contains Bolo test category:', !!boloTestCategory);
    console.log('   Contains Seekho test category:', !!seekhoTestCategoryInBolo);
    
    // Test 3: Get categories without package ID (should default to Seekho)
    console.log('\n3. Testing without package ID (should default to Seekho):');
    const defaultResponse = await fetch('http://localhost:8000/api/categories', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const defaultData = await defaultResponse.json();
    console.log('   Categories found:', defaultData.count);
    const seekhoTestCategoryInDefault = defaultData.data.find(cat => cat.name === 'Test Category Seekho');
    const boloTestCategoryInDefault = defaultData.data.find(cat => cat.name === 'Test Category Bolo');
    console.log('   Contains Seekho test category:', !!seekhoTestCategoryInDefault);
    console.log('   Contains Bolo test category:', !!boloTestCategoryInDefault);
    
    // Analyze results
    console.log('\n📊 Results Analysis:');
    const seekhoFilteringWorks = seekhoTestCategory && !boloTestCategoryInSeekhoo;
    const boloFilteringWorks = boloTestCategory && !seekhoTestCategoryInBolo;
    const defaultFilteringWorks = seekhoTestCategoryInDefault && !boloTestCategoryInDefault;
    
    console.log('   ✅ Seekho filtering works:', seekhoFilteringWorks);
    console.log('   ✅ Bolo filtering works:', boloFilteringWorks);
    console.log('   ✅ Default filtering works:', defaultFilteringWorks);
    
    if (seekhoFilteringWorks && boloFilteringWorks && defaultFilteringWorks) {
      console.log('\n🎉 All package filtering tests PASSED!');
    } else {
      console.log('\n❌ Some package filtering tests FAILED!');
    }
    
    // Clean up
    await Category.findByIdAndDelete(seekhoCategory._id);
    await Category.findByIdAndDelete(boloCategory._id);
    console.log('\n🧹 Test categories cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testPackageFiltering();
