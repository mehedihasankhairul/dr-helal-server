#!/usr/bin/env node

const API_BASE = 'http://localhost:3001/api/gomoti-slots';

async function testGomotiSlots() {
  console.log('🧪 Testing Gomoti Hospital Slot API...\n');
  
  try {
    // Test 1: Thursday slots (should have 6 slots)
    console.log('📅 Test 1: Thursday slots (2025-08-28)');
    const thursdayResponse = await fetch(`${API_BASE}/gomoti/2025-08-28`);
    const thursdayData = await thursdayResponse.json();
    
    if (thursdayResponse.ok) {
      console.log('✅ Thursday test successful');
      console.log(`   Day type: ${thursdayData.day_type}`);
      console.log(`   Total slots: ${thursdayData.total_slots}`);
      console.log('   Slots:');
      thursdayData.slots.forEach((slot, i) => {
        console.log(`     ${i+1}. ${slot.time_slot} (${slot.current_appointments}/${slot.max_appointments})`);
      });
    } else {
      console.log('❌ Thursday test failed:', thursdayData);
    }
    
    // Test 2: Regular day slots (should have 5 slots)  
    console.log('\n📅 Test 2: Regular day slots (2025-08-27 - Wednesday)');
    const regularResponse = await fetch(`${API_BASE}/gomoti/2025-08-27`);
    const regularData = await regularResponse.json();
    
    if (regularResponse.ok) {
      console.log('✅ Regular day test successful');
      console.log(`   Day type: ${regularData.day_type}`);
      console.log(`   Total slots: ${regularData.total_slots}`);
      console.log('   Slots:');
      regularData.slots.forEach((slot, i) => {
        console.log(`     ${i+1}. ${slot.time_slot} (${slot.current_appointments}/${slot.max_appointments})`);
      });
    } else {
      console.log('❌ Regular day test failed:', regularData);
    }
    
    // Test 3: Friday (closed)
    console.log('\n📅 Test 3: Friday (closed) - 2025-08-29');
    const fridayResponse = await fetch(`${API_BASE}/gomoti/2025-08-29`);
    const fridayData = await fridayResponse.json();
    
    if (fridayResponse.ok && fridayData.is_closed) {
      console.log('✅ Friday test successful');
      console.log(`   Message: ${fridayData.message}`);
      console.log(`   Slots: ${fridayData.slots.length}`);
    } else {
      console.log('❌ Friday test failed:', fridayData);
    }
    
    // Test 4: Past date (should fail)
    console.log('\n📅 Test 4: Past date (should fail) - 2025-08-20');
    const pastResponse = await fetch(`${API_BASE}/gomoti/2025-08-20`);
    const pastData = await pastResponse.json();
    
    if (!pastResponse.ok) {
      console.log('✅ Past date test successful (correctly blocked)');
      console.log(`   Error: ${pastData.error}`);
    } else {
      console.log('❌ Past date test failed (should have been blocked):', pastData);
    }
    
    // Test 5: Calendar view
    console.log('\n📅 Test 5: Calendar view (August 2025)');
    const calendarResponse = await fetch(`${API_BASE}/gomoti/calendar/2025/8`);
    const calendarData = await calendarResponse.json();
    
    if (calendarResponse.ok) {
      console.log('✅ Calendar test successful');
      console.log(`   Month: ${calendarData.month_name} ${calendarData.year}`);
      console.log('   Sample days:');
      calendarData.calendar.slice(23, 31).forEach(day => {
        const status = day.is_closed ? 'Closed' : 
                      day.is_past ? 'Past' : 
                      `${day.total_slots} slots`;
        console.log(`     ${day.date} (${day.day_name}): ${status}`);
      });
    } else {
      console.log('❌ Calendar test failed:', calendarData);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm start');
  }
}

// Run tests
testGomotiSlots();
