import ClientSlotGenerator from '../dr-helal-appointments/src/services/ClientSlotGenerator.js';

// Mock API service for testing
const mockApiService = {
  get: async (endpoint) => {
    console.log(`Mock API call: ${endpoint}`);
    return {
      hospital_id: 'alsefa',
      slot_counts: {},
      total_appointments: 0,
      last_updated: new Date().toISOString()
    };
  }
};

// Test Al-Sefa Hospital schedule
async function testAlSefaHospital() {
  console.log('🏥 Testing Al-Sefa Hospital (Friday-only schedule)\n');
  
  const generator = new ClientSlotGenerator(mockApiService);
  
  console.log('📋 Available Hospitals:');
  const hospitals = generator.getHospitals();
  const alsefaHospital = hospitals.find(h => h.id === 'alsefa');
  
  if (alsefaHospital) {
    console.log(`   ✅ ${alsefaHospital.name} found`);
    console.log(`   - Doctor: ${alsefaHospital.doctorName}`);
    console.log(`   - Max per slot: ${alsefaHospital.maxPerSlot}`);
    console.log(`   - Operating days: ${alsefaHospital.operatingDays.length}`);
    alsefaHospital.operatingDays.forEach(day => {
      console.log(`     ${day.dayName}: ${day.timeRange} (${day.slotsCount} slots)`);
    });
  } else {
    console.log('   ❌ Al-Sefa Hospital not found');
    return;
  }
  
  console.log('\n🗓️ Testing Al-Sefa Hospital for different days of week:\n');
  
  // Test dates for each day of the week
  const testDates = [
    { date: '2025-08-24', day: 'Sunday' },
    { date: '2025-08-25', day: 'Monday' }, 
    { date: '2025-08-26', day: 'Tuesday' },
    { date: '2025-08-27', day: 'Wednesday' },
    { date: '2025-08-28', day: 'Thursday' },
    { date: '2025-08-29', day: 'Friday' },    // Should be OPEN
    { date: '2025-08-30', day: 'Saturday' }
  ];
  
  for (const testDate of testDates) {
    const result = generator.generateSlots('alsefa', testDate.date);
    
    console.log(`📅 ${testDate.date} (${testDate.day}):`);
    
    if (result.success) {
      if (result.isClosed) {
        console.log(`   🚫 CLOSED - ${result.message}`);
      } else {
        console.log(`   ✅ OPEN - ${result.availableSlots.length} slots available`);
        console.log(`   ⏰ Time range: ${result.timeRange}`);
        console.log(`   📊 Total capacity: ${result.totalCapacity} appointments`);
        
        // Show first few time slots
        console.log('   🕐 Sample time slots:');
        result.availableSlots.slice(0, 3).forEach(slot => {
          console.log(`     - ${slot.timeSlot} (${slot.availableSpots}/${slot.maxAppointments} available)`);
        });
        if (result.availableSlots.length > 3) {
          console.log(`     ... and ${result.availableSlots.length - 3} more slots`);
        }
      }
    } else {
      console.log(`   ❌ ERROR - ${result.error}`);
    }
    console.log('');
  }
  
  console.log('📊 Summary:');
  console.log('✅ Al-Sefa Hospital should be:');
  console.log('   - CLOSED on Sunday, Monday, Tuesday, Wednesday, Thursday, Saturday');
  console.log('   - OPEN on Friday (10 AM - 7 PM with 9 hourly slots)');
  console.log('   - 25 appointments per slot (225 total capacity on Fridays)');
  
  console.log('\n🎯 Al-Sefa Hospital test completed!');
}

// Run the test
testAlSefaHospital().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
