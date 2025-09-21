#!/usr/bin/env node

// Test CORS configuration for the backend server
import fetch from 'node-fetch'; // You may need to install: npm install node-fetch

const API_URL = process.env.API_URL || 'https://server.drhelalahmed.com/api';
const LOCAL_API = 'http://localhost:3001/api';

async function testCORS(baseUrl, description) {
  console.log(`\n🧪 Testing CORS for ${description}`);
  console.log(`📡 API URL: ${baseUrl}`);
  
  const testOrigins = [
    'https://portal.drhelalahmed.com',
    'https://drhelalahmed.com', 
    'https://drhelal-server.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ];
  
  for (const origin of testOrigins) {
    console.log(`\n🔍 Testing origin: ${origin}`);
    
    try {
      // Test preflight OPTIONS request first
      const preflightResponse = await fetch(`${baseUrl}/auth/doctor-login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const preflightStatus = preflightResponse.status;
      const corsHeaders = {
        'Access-Control-Allow-Origin': preflightResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': preflightResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': preflightResponse.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': preflightResponse.headers.get('Access-Control-Allow-Credentials')
      };
      
      console.log(`   Preflight Status: ${preflightStatus}`);
      console.log(`   CORS Headers:`, corsHeaders);
      
      if (preflightStatus === 200 && corsHeaders['Access-Control-Allow-Origin']) {
        console.log(`   ✅ CORS preflight successful`);
        
        // Test actual POST request
        const loginResponse = await fetch(`${baseUrl}/auth/doctor-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': origin
          },
          body: JSON.stringify({
            loginType: 'pin',
            pin: '123456'
          })
        });
        
        if (loginResponse.ok) {
          const result = await loginResponse.json();
          console.log(`   ✅ PIN login successful - Token: ${result.token ? 'Present' : 'Missing'}`);
        } else {
          const error = await loginResponse.json();
          console.log(`   ❌ PIN login failed: ${error.error || loginResponse.statusText}`);
        }
      } else {
        console.log(`   ❌ CORS preflight failed`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔧 CORS Configuration Test Suite');
  console.log('==================================');
  
  // Test production API
  await testCORS(API_URL, 'Production API (server.drhelalahmed.com)');
  
  // Test local API if available
  try {
    const localHealthCheck = await fetch(`${LOCAL_API}/health`);
    if (localHealthCheck.ok) {
      await testCORS(LOCAL_API, 'Local Development API (localhost:3001)');
    }
  } catch (error) {
    console.log('\n⚠️ Local API not available (this is normal if not running locally)');
  }
  
  console.log('\n🎉 CORS testing completed!');
  console.log('\n📝 Expected Results After Fix:');
  console.log('   ✅ https://portal.drhelalahmed.com should work');
  console.log('   ✅ https://drhelalahmed.com should work'); 
  console.log('   ✅ localhost origins should work');
}

main().catch(console.error);
