#!/usr/bin/env node

/**
 * Comprehensive test script for Dr. Helal appointment server endpoints
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
const TEST_DATE = '2025-08-25';
const TEST_TIME = '05:00 PM - 06:00 PM';

async function runTests() {
  console.log('🧪 Starting Dr. Helal Server Tests\n');
  console.log('📍 Server URL:', BASE_URL);
  console.log('📅 Test Date:', TEST_DATE);
  console.log('⏰ Test Time:', TEST_TIME);
  console.log('=' .repeat(60));

  const tests = [
    // 1. Health Check
    {
      name: 'Health Check',
      method: 'GET',
      url: `${BASE_URL}/health`,
      expectedStatus: 200
    },

    // 2. CORS Test
    {
      name: 'CORS Test (localhost:5173)',
      method: 'GET',
      url: `${BASE_URL}/cors-test`,
      headers: {
        'Origin': 'http://localhost:5173'
      },
      expectedStatus: 200
    },

    // 3. CORS Test (production)
    {
      name: 'CORS Test (dr-helal.vercel.app)',
      method: 'GET',
      url: `${BASE_URL}/cors-test`,
      headers: {
        'Origin': 'https://dr-helal.vercel.app'
      },
      expectedStatus: 200
    },

    // 4. Hospital Schedules
    {
      name: 'Get Hospital Schedules',
      method: 'GET',
      url: `${BASE_URL}/hospital-schedules`,
      expectedStatus: 200
    },

    // 5. Specific Hospital Schedule (Gomoti)
    {
      name: 'Get Gomoti Hospital Schedule',
      method: 'GET',
      url: `${BASE_URL}/hospital-schedules/gomoti`,
      expectedStatus: 200
    },

    // 6. Hospital Days (Gomoti)
    {
      name: 'Get Gomoti Hospital Days',
      method: 'GET',
      url: `${BASE_URL}/hospital-schedules/gomoti/days`,
      expectedStatus: 200
    },

    // 7. Hospital Slots for Monday (Day 1)
    {
      name: 'Get Gomoti Monday Slots',
      method: 'GET',
      url: `${BASE_URL}/hospital-schedules/gomoti/day/1/slots`,
      expectedStatus: 200
    },

    // 8. Availability Check (Gomoti)
    {
      name: 'Check Gomoti Availability',
      method: 'GET',
      url: `${BASE_URL}/availability/gomoti/${TEST_DATE}`,
      expectedStatus: 200
    },

    // 9. Slot Availability (Enhanced)
    {
      name: 'Check Slot Availability (Enhanced)',
      method: 'GET',
      url: `${BASE_URL}/appointments/availability/gomoti/${TEST_DATE}/${encodeURIComponent(TEST_TIME)}`,
      expectedStatus: 200
    },

    // 10. Capacity Configuration
    {
      name: 'Get Capacity Configuration',
      method: 'GET',
      url: `${BASE_URL}/capacity-config`,
      expectedStatus: 200
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`\n🧪 ${test.name}`);
      console.log(`   ${test.method} ${test.url}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 5000,
        ...(test.headers && { headers: test.headers }),
        ...(test.data && { data: test.data })
      };

      const response = await axios(config);
      
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ PASSED (${response.status})`);
        
        // Show some key data for important endpoints
        if (test.name.includes('Health')) {
          console.log(`      Uptime: ${response.data.uptime?.toFixed(2)}s`);
          console.log(`      Features: ${Object.keys(response.data.features || {}).length}`);
        } else if (test.name.includes('CORS')) {
          console.log(`      Origin: ${response.data.origin}`);
          console.log(`      Message: ${response.data.message}`);
        } else if (test.name.includes('Hospital Schedules') && !test.name.includes('Get Gomoti')) {
          console.log(`      Total Schedules: ${response.data.schedules?.length || 0}`);
        } else if (test.name.includes('Availability')) {
          console.log(`      Total Appointments: ${response.data.total_appointments || response.data.current_bookings || 0}`);
        }
        
        passedTests++;
      } else {
        console.log(`   ❌ FAILED (Expected ${test.expectedStatus}, got ${response.status})`);
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ FAILED (${error.message})`);
      if (error.response) {
        console.log(`      Status: ${error.response.status}`);
        console.log(`      Error: ${error.response.data?.error || 'Unknown error'}`);
      }
      failedTests++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Server is running correctly.');
    console.log('\n💡 Client-side applications can now:');
    console.log('   - Fetch hospital schedules');
    console.log('   - Check slot availability');
    console.log('   - Book appointments');
    console.log('   - Handle CORS requests from both development and production');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please check the server configuration.`);
  }

  console.log('\n🚀 Server should be accessible at:');
  console.log(`   📍 Health: ${BASE_URL}/health`);
  console.log(`   🏥 Schedules: ${BASE_URL}/hospital-schedules`);
  console.log(`   📊 Availability: ${BASE_URL}/availability/gomoti/${TEST_DATE}`);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
