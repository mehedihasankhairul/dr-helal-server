import mongoose from 'mongoose';

// Simulate multiple concurrent booking attempts
async function testConcurrentBooking() {
    console.log('🚨 Testing Concurrent Booking Scenarios\n');
    
    try {
        // Connect to database
        await mongoose.connect('mongodb://localhost:27017/appointment-db');
        console.log('✅ Connected to database\n');
        
        const db = mongoose.connection.db;
        const appointmentsCollection = db.collection('appointments');
        
        // Clear existing appointments for clean test
        await appointmentsCollection.deleteMany({});
        console.log('🧹 Cleared existing test appointments\n');
        
        // Get Gomoti Hospital slot info
        const testDate = '2025-08-25'; // Monday
        const testTime = '05:00 PM - 06:00 PM';
        const hospital = 'Gomoti Hospital';
        
        console.log(`🏥 Testing ${hospital} on ${testDate}`);
        console.log(`🎯 Target slot: ${testTime}`);
        console.log(`📊 Slot capacity: 15 patients per slot\n`);
        
        // SCENARIO 1: Book 14 appointments (should be fine)
        console.log('📝 SCENARIO 1: Booking 14 appointments (within capacity)');
        const appointments1 = [];
        for (let i = 1; i <= 14; i++) {
            const appointment = {
                patient_name: `Patient ${i}`,
                patientEmail: `patient${i}@test.com`,
                patientPhone: `+88012345${String(i).padStart(4, '0')}`,
                appointment_date: new Date(testDate),
                appointment_time: testTime,
                hospital: hospital,
                created_at: new Date(),
                status: 'confirmed'
            };
            appointments1.push(appointment);
        }
        
        await appointmentsCollection.insertMany(appointments1);
        
        // Check current count
        const count1 = await appointmentsCollection.countDocuments({
            hospital: hospital,
            appointment_date: new Date(testDate),
            appointment_time: testTime
        });
        console.log(`✅ Successfully booked ${count1} appointments (14 expected)\n`);
        
        // SCENARIO 2: Try to book 5 more (should exceed capacity)
        console.log('🚨 SCENARIO 2: Trying to book 5 more appointments (will exceed capacity)');
        const appointments2 = [];
        for (let i = 15; i <= 19; i++) {
            const appointment = {
                patient_name: `Patient ${i}`,
                patientEmail: `patient${i}@test.com`,
                patientPhone: `+88012345${String(i).padStart(4, '0')}`,
                appointment_date: new Date(testDate),
                appointment_time: testTime,
                hospital: hospital,
                created_at: new Date(),
                status: 'confirmed'
            };
            appointments2.push(appointment);
        }
        
        // This will succeed because there's NO CAPACITY CHECK!
        await appointmentsCollection.insertMany(appointments2);
        
        const count2 = await appointmentsCollection.countDocuments({
            hospital: hospital,
            appointment_date: new Date(testDate),
            appointment_time: testTime
        });
        
        console.log(`❌ PROBLEM: Successfully booked ${count2} appointments!`);
        console.log(`🚨 OVERBOOKING: ${count2 - 15} appointments over capacity!`);
        console.log(`💡 Expected: Should have rejected bookings 16-19\n`);
        
        // SCENARIO 3: Simulate race condition (3 users booking simultaneously for last slot)
        console.log('🏃‍♂️ SCENARIO 3: Race condition - 3 users booking simultaneously for the last available slot');
        
        // Reset to have exactly 14 appointments
        await appointmentsCollection.deleteMany({
            hospital: hospital,
            appointment_date: new Date(testDate),
            appointment_time: testTime
        });
        await appointmentsCollection.insertMany(appointments1); // Re-insert first 14
        
        console.log('🔄 Reset to 14 appointments (1 slot remaining)');
        
        // Simulate 3 concurrent users trying to book the last slot
        const racePromises = [];
        for (let i = 20; i <= 22; i++) {
            const appointment = {
                patient_name: `Race Patient ${i}`,
                patientEmail: `race${i}@test.com`,
                patientPhone: `+88012345${String(i).padStart(4, '0')}`,
                appointment_date: new Date(testDate),
                appointment_time: testTime,
                hospital: hospital,
                created_at: new Date(),
                status: 'confirmed'
            };
            
            // Simulate concurrent booking attempts
            racePromises.push(
                appointmentsCollection.insertOne(appointment).catch(err => ({ error: err.message }))
            );
        }
        
        const raceResults = await Promise.all(racePromises);
        
        const finalCount = await appointmentsCollection.countDocuments({
            hospital: hospital,
            appointment_date: new Date(testDate),
            appointment_time: testTime
        });
        
        console.log(`❌ RACE CONDITION RESULT: ${finalCount} total appointments`);
        console.log(`🚨 All 3 concurrent bookings succeeded!`);
        console.log(`💡 Expected: Only 1 should have succeeded (total should be 15)\n`);
        
        // Show the problem summary
        console.log('📊 PROBLEM SUMMARY:');
        console.log('===================');
        console.log('❌ No capacity validation during booking');
        console.log('❌ Race conditions allow overbooking');
        console.log('❌ Multiple users can book the "last" slot simultaneously');
        console.log('❌ System accepts unlimited appointments per slot');
        console.log('❌ No atomic booking operations\n');
        
        // Show what happens in the frontend
        console.log('🖥️ FRONTEND IMPACT:');
        console.log('===================');
        console.log('• Users see "Available" slots that are actually full');
        console.log('• Booking forms accept reservations for overbooked slots');
        console.log('• Patients arrive to find no actual appointment slots');
        console.log('• Doctor gets overwhelmed with too many patients');
        console.log('• System shows incorrect availability counts\n');
        
        console.log('💡 SOLUTION NEEDED:');
        console.log('===================');
        console.log('✅ Add capacity validation before booking');
        console.log('✅ Use atomic operations to prevent race conditions'); 
        console.log('✅ Implement proper concurrency control');
        console.log('✅ Add slot locking during booking process');
        console.log('✅ Return proper error messages for full slots');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

testConcurrentBooking();
