import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE = process.env.CLIENT_URL ? 
  process.env.CLIENT_URL.replace('5173', '3001') : 
  'http://localhost:3001';

const API_URL = `${API_BASE}/api`;

console.log('🔧 Testing Content Delete API');
console.log('📍 API URL:', API_URL);
console.log('🔑 JWT Secret (first 10 chars):', process.env.JWT_SECRET?.substring(0, 10) + '...');

async function testAdminLogin() {
  console.log('\n🔐 Testing admin login...');
  
  try {
    const response = await fetch(`${API_URL}/auth/doctor-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@drhelal.com',
        password: 'drhelal123',
        loginType: 'email'
      })
    });

    const data = await response.json();
    
    console.log('📊 Login Response Status:', response.status);
    console.log('📋 Login Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      console.log('✅ Login successful!');
      console.log('🎫 Token (first 50 chars):', data.token.substring(0, 50) + '...');
      return data.token;
    } else {
      console.log('❌ Login failed:', data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('🚨 Login request error:', error.message);
    return null;
  }
}

async function listContent(token) {
  console.log('\n📋 Getting content list for deletion test...');
  
  try {
    const response = await fetch(`${API_URL}/content/admin?limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    console.log('📊 Content List Status:', response.status);
    
    if (response.ok && data.content && data.content.length > 0) {
      console.log('✅ Found content items:', data.content.length);
      console.log('🎯 First content item ID:', data.content[0]._id);
      return data.content[0]._id;
    } else {
      console.log('❌ No content found or error:', data.error || 'No content available');
      return null;
    }
  } catch (error) {
    console.error('🚨 Content list request error:', error.message);
    return null;
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
        category: 'general',
        is_published: true
      })
    });

    const data = await response.json();
    
    console.log('📊 Create Content Status:', response.status);
    
    if (response.ok && data.content) {
      console.log('✅ Test content created successfully');
      console.log('🎯 New content ID:', data.content._id);
      return data.content._id;
    } else {
      console.log('❌ Failed to create test content:', data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('🚨 Create content request error:', error.message);
    return null;
  }
}

async function testContentDelete(token, contentId) {
  console.log('\n🗑️ Testing content deletion...');
  console.log('🎯 Deleting content ID:', contentId);
  console.log('🎫 Using token (first 50 chars):', token.substring(0, 50) + '...');
  
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
    
    if (response.ok) {
      console.log('✅ Content deleted successfully!');
      return true;
    } else {
      console.log('❌ Delete failed:', data.error || 'Unknown error');
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      return false;
    }
  } catch (error) {
    console.error('🚨 Delete request error:', error.message);
    return false;
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
    
    if (response.ok) {
      console.log('✅ Token is valid!');
      return true;
    } else {
      console.log('❌ Token verification failed:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('🚨 Token verification error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Content Delete API Tests');
  console.log('=' .repeat(50));
  
  // Step 1: Login as admin
  const token = await testAdminLogin();
  if (!token) {
    console.log('🛑 Cannot proceed without valid token');
    return;
  }
  
  // Step 2: Verify token works
  const tokenValid = await testTokenVerification(token);
  if (!tokenValid) {
    console.log('🛑 Token verification failed, cannot proceed');
    return;
  }
  
  // Step 3: Create test content
  let contentId = await createTestContent(token);
  
  // Step 4: If no test content was created, try to find existing content
  if (!contentId) {
    console.log('⚠️ No test content created, trying to find existing content...');
    contentId = await listContent(token);
  }
  
  if (!contentId) {
    console.log('🛑 No content available for deletion test');
    return;
  }
  
  // Step 5: Test content deletion
  const deleteSuccess = await testContentDelete(token, contentId);
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test Results Summary:');
  console.log('🔐 Admin Login:', token ? '✅ SUCCESS' : '❌ FAILED');
  console.log('🎫 Token Verification:', tokenValid ? '✅ SUCCESS' : '❌ FAILED');
  console.log('🗑️ Content Deletion:', deleteSuccess ? '✅ SUCCESS' : '❌ FAILED');
  
  if (!deleteSuccess) {
    console.log('\n🔧 Debugging Tips:');
    console.log('1. Check if the server is running on port 3001');
    console.log('2. Verify JWT_SECRET matches between login and verification');
    console.log('3. Check if the content ID exists in the database');
    console.log('4. Ensure the user has admin role');
    console.log('5. Check server logs for authentication errors');
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('🚨 Test execution error:', error);
    process.exit(1);
  });
}

export { runTests };
