import fetch from 'node-fetch';

const API_BASE = 'https://server.drhelalahmed.com/api';

// Test data for content upload
const testContent = {
  title: "Test Health Article",
  description: "This is a test article about health tips and wellness advice from Dr. Helal.",
  content_type: "article",
  content_url: "https://example.com/health-article",
  thumbnail_url: "https://example.com/thumbnail.jpg",
  category: "health",
  tags: ["health", "wellness", "tips"],
  is_published: false,
  is_featured: false
};

// Your JWT token from the console log
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MTQ2NzI0NGEzYjJjOTMwN2NjNjkzNiIsImVtYWlsIjoiZG9jdG9yQGRyaGVsYWwuY29tIiwicm9sZSI6ImRvY3RvciIsImlhdCI6MTcyOTYxNzgwMCwiZXhwIjoxNzI5NzA0MjAwfQ.oyx8KLH9zCrw5JPdMs1Wc7roo8Q-C6ksDFoTSpmt_xw";

async function testContentUpload() {
  console.log('🧪 Testing content upload...');
  console.log('📤 Request data:', JSON.stringify(testContent, null, 2));
  
  try {
    const response = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(testContent)
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.text();
    console.log('📥 Raw response:', responseData);
    
    try {
      const jsonData = JSON.parse(responseData);
      console.log('📋 Parsed response:', JSON.stringify(jsonData, null, 2));
      
      if (jsonData.details) {
        console.log('❌ Validation errors:');
        jsonData.details.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse response as JSON');
    }

  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

// Test different content types
async function testDifferentContentTypes() {
  const contentTypes = [
    {
      name: "YouTube Video",
      data: {
        title: "Health Tips YouTube Video",
        description: "Educational video about health",
        content_type: "youtube",
        content_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        category: "education"
      }
    },
    {
      name: "Facebook Post",
      data: {
        title: "Health Awareness Facebook Post",
        description: "Social media post about health awareness",
        content_type: "facebook",
        content_url: "https://www.facebook.com/post/123456",
        category: "social"
      }
    },
    {
      name: "Invalid URL Format",
      data: {
        title: "Test with Invalid URL",
        description: "Testing invalid URL format",
        content_type: "article",
        content_url: "not-a-valid-url",
        category: "test"
      }
    },
    {
      name: "Missing Required Fields",
      data: {
        description: "Testing with missing title and content_url"
      }
    },
    {
      name: "Title Too Short",
      data: {
        title: "Hi",
        content_type: "article",
        content_url: "https://example.com/article"
      }
    }
  ];

  for (const test of contentTypes) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log('📤 Request data:', JSON.stringify(test.data, null, 2));
    
    try {
      const response = await fetch(`${API_BASE}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(test.data)
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const responseData = await response.text();
      try {
        const jsonData = JSON.parse(responseData);
        if (jsonData.error) {
          console.log(`❌ Error: ${jsonData.error}`);
        }
        if (jsonData.details) {
          console.log('📋 Validation details:');
          jsonData.details.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        }
        if (response.status === 201) {
          console.log('✅ Success!');
        }
      } catch (parseError) {
        console.log('⚠️ Non-JSON response:', responseData);
      }
    } catch (error) {
      console.error(`💥 ${test.name} failed:`, error.message);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run tests
console.log('🚀 Starting content upload tests...');
console.log(`🔗 API Base: ${API_BASE}`);
console.log(`🔑 Using auth token: ${AUTH_TOKEN.substring(0, 20)}...`);

testContentUpload()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Running additional tests with different scenarios...');
    return testDifferentContentTypes();
  })
  .then(() => {
    console.log('\n✨ All tests completed!');
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
  });
