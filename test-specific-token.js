import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE = 'http://localhost:3001';
const API_URL = `${API_BASE}/api`;

// Your provided token
const PROVIDED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTM5ZmY1YTY2NTUyMTAwNjY3ZWJkZCIsImVtYWlsIjoiYWRtaW5AZHJoZWxhbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiRHIuIEhlbGFsIEFkbWluIiwibG9naW5UeXBlIjoicGFzc3dvcmQiLCJpYXQiOjE3NTkxNjM5NDYsImV4cCI6MTc1OTI1MDM0Nn0.b3dM-R9G_tgtZeVnlyhUNUTgtiR-wliEHjMRtmuhEDg';

console.log('🔧 Testing Content Delete API with Provided Token');
console.log('📍 API URL:', API_URL);

function decodeToken(token) {
  try {
    const decoded = jwt.decode(token);
    console.log('🎫 Token Payload:');
    console.log('   User ID:', decoded.id);
    console.log('   Email:', decoded.email);
    console.log('   Role:', decoded.role);
    console.log('   Name:', decoded.name);
    console.log('   Login Type:', decoded.loginType);
    console.log('   Issued At:', new Date(decoded.iat * 1000).toISOString());
    console.log('   Expires At:', new Date(decoded.exp * 1000).toISOString());
    console.log('   Is Expired:', Date.now() > decoded.exp * 1000);
    return decoded;
  } catch (error) {
    console.error('❌ Failed to decode token:', error.message);
    return null;
  }
}

async function testTokenVerification(token) {
  console.log('\n🔍 Testing token verification with profile endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    console.log('📊 Profile Response Status:', response.status);
    console.log('📋 Profile Response:', JSON.stringify(data, null, 2));
    
    return response.ok;
  } catch (error) {
    console.error('🚨 Token verification error:', error.message);
    return false;
  }
}

async function createTestContent(token) {
  console.log('\n➕ Creating test content for deletion...');
  
  try {
    const response = await fetch(`${API_URL}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Content for Deletion',
        description: 'This content is created for testing the delete functionality',
        content_type: 'article',
        content_url: 'https://example.com/test-content',
        thumbnail_url: 'https://example.com/thumbnail.jpg',
        category: 'general',
        tags: ['test'],
        is_published: true
      })
    });

    const data = await response.json();
    
    console.log('📊 Create Content Status:', response.status);
    console.log('📋 Create Content Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.content) {
      return data.content.id || data.content._id;
    }
    return null;
  } catch (error) {
    console.error('🚨 Create content request error:', error.message);
    return null;
  }
}

async function testContentDelete(token, contentId) {
  console.log('\n🗑️ Testing content deletion...');
  console.log('🎯 Deleting content ID:', contentId);
  
  try {
    const response = await fetch(`${API_URL}/content/${contentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    console.log('📊 Delete Response Status:', response.status);
    console.log('📋 Delete Response:', JSON.stringify(data, null, 2));
    
    return response.ok;
  } catch (error) {
    console.error('🚨 Delete request error:', error.message);
    return false;
  }
}

async function createNewAdmin() {
  console.log('\n👤 Creating new admin user: admin@drhelalahmed.com...');
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@drhelalahmed.com',
        password: 'helal2025',
        full_name: 'Dr. Helal Admin',
        role: 'admin'
      })
    });

    const data = await response.json();
    
    console.log('📊 Registration Status:', response.status);
    console.log('📋 Registration Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      return data.token;
    }
    return null;
  } catch (error) {
    console.error('🚨 Registration error:', error.message);
    return null;
  }
}

async function loginNewAdmin() {
  console.log('\n🔐 Logging in with new admin credentials...');
  
  try {
    const response = await fetch(`${API_URL}/auth/doctor-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@drhelalahmed.com',
        password: 'helal2025',
        loginType: 'email'
      })
    });

    const data = await response.json();
    
    console.log('📊 Login Status:', response.status);
    console.log('📋 Login Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      return data.token;
    }
    return null;
  } catch (error) {
    console.error('🚨 Login error:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Content Delete API Tests');
  console.log('=' .repeat(60));
  
  // Decode the provided token
  console.log('\n📋 Decoding provided token...');
  const decoded = decodeToken(PROVIDED_TOKEN);
  
  // Test the provided token
  console.log('\n🧪 Testing provided token...');
  const tokenWorks = await testTokenVerification(PROVIDED_TOKEN);
  
  let workingToken = null;
  
  if (tokenWorks) {
    console.log('✅ Provided token works!');
    workingToken = PROVIDED_TOKEN;
  } else {
    console.log('❌ Provided token failed. Trying to create new admin...');
    
    // Try to create new admin
    workingToken = await createNewAdmin();
    
    if (!workingToken) {
      // If registration fails, try login (user might already exist)
      workingToken = await loginNewAdmin();
    }
  }
  
  if (!workingToken) {
    console.log('🛑 Could not get a working token. Stopping tests.');
    return;
  }
  
  console.log('\n✅ Got working token!');
  
  // Test creating content
  const contentId = await createTestContent(workingToken);
  
  if (!contentId) {
    console.log('🛑 Could not create test content. Cannot test deletion.');
    return;
  }
  
  // Test deleting content
  const deleteSuccess = await testContentDelete(workingToken, contentId);
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Test Results Summary:');
  console.log('🎫 Provided Token Works:', tokenWorks ? '✅ SUCCESS' : '❌ FAILED');
  console.log('🔐 Working Token Obtained:', workingToken ? '✅ SUCCESS' : '❌ FAILED');
  console.log('➕ Content Creation:', contentId ? '✅ SUCCESS' : '❌ FAILED');
  console.log('🗑️ Content Deletion:', deleteSuccess ? '✅ SUCCESS' : '❌ FAILED');
  
  if (deleteSuccess) {
    console.log('\n🎉 Content deletion is working correctly!');
    console.log('🎫 Working token for future use:');
    console.log(workingToken);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('🚨 Test execution error:', error);
  process.exit(1);
});
