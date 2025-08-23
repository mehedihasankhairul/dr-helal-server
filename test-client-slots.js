import ClientSlotGenerator from './client/slot-generator.js';

// Test client-side slot generation
async function testClientSlotGenerator() {
  console.log('🧪 Testing Client-Side Slot Generator\n');
  
  const generator = new ClientSlotGenerator('http://localhost:3000/api');
  
  console.log('📋 Available Hospitals:');
  const hospitals = generator.getHospitals();
  hospitals.forEach(hospital => {
    console.log(`   - ${hospital.name} (${hospital.id})`);
    console.log(`     Doctor: ${hospital.doctorName}`);
    console.log(`     Max per slot: ${hospital.maxPerSlot}`);
    console.log(`     Operating days: ${hospital.operatingDays.length}`);
    hospital.operatingDays.forEach(day => {
      console.log(`       ${day.dayName}: ${day.timeRange} (${day.slotsCount} slots)`);
    });
    console.log('');
  });
  
  console.log('🗓️ Testing slot generation for different dates:\n');
  
  // Test dates
  const testDates = [
    '2025-08-24', // Saturday
    '2025-08-25', // Sunday  
    '2025-08-26', // Monday
    '2025-08-27', // Tuesday
    '2025-08-28', // Wednesday
    '2025-08-29', // Thursday
    '2025-08-30'  // Friday (should be closed)
  ];
  
  for (const hospital of hospitals) {
    console.log(`🏥 Testing ${hospital.name}:`);
    
    for (const date of testDates) {
      const result = generator.generateSlots(hospital.id, date);
      const dayName = new Date(date.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long' });
      
      if (result.success) {
        if (result.isClosed) {
          console.log(`   ${date} (${dayName}): CLOSED - ${result.message}`);
        } else {
          console.log(`   ${date} (${dayName}): ${result.availableSlots.length} slots available`);
          console.log(`     Time range: ${result.timeRange}`);
          console.log(`     Total capacity: ${result.totalCapacity} appointments`);
        }
      } else {
        console.log(`   ${date} (${dayName}): ERROR - ${result.error}`);
      }
    }
    console.log('');
  }
  
  console.log('📅 Testing calendar generation:\n');
  
  for (const hospital of hospitals) {
    console.log(`📊 Calendar for ${hospital.name} (next 7 days):`);
    
    const calendarResult = generator.generateCalendar(hospital.id, '2025-08-24', 7);
    
    if (calendarResult.success) {
      calendarResult.calendar.forEach(day => {
        const statusIcon = day.status === 'past' ? '⏳' : 
                          day.status.includes('closed') ? '🚫' : '✅';
        console.log(`   ${day.date} (${day.dayName}): ${statusIcon} ${day.status}`);
        
        if (day.slotsCount > 0) {
          console.log(`     ${day.slotsCount} slots, ${day.totalCapacity} total capacity`);
          console.log(`     ${day.timeRange}`);
        }
      });
    } else {
      console.log(`   Error: ${calendarResult.error}`);
    }
    console.log('');
  }
  
  console.log('✅ Client-side slot generation test completed!');
}

// Run the test
testClientSlotGenerator().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
