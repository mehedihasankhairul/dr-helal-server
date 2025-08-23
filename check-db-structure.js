import { getCollection } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabaseStructure() {
    console.log('🔍 Checking Database Structure and Sample Data');
    console.log('===============================================\n');

    try {
        const appointmentsCollection = getCollection('appointments');
        
        // Get total count
        const totalCount = await appointmentsCollection.countDocuments();
        console.log(`📊 Total appointments in database: ${totalCount}\n`);
        
        if (totalCount === 0) {
            console.log('❌ No appointments found in database');
            console.log('💡 You may need to create a test appointment first');
            return;
        }

        // Get latest 3 appointments to see the structure
        const sampleAppointments = await appointmentsCollection
            .find({})
            .sort({ created_at: -1 })
            .limit(3)
            .toArray();

        console.log('📋 Sample Appointments Structure:');
        console.log('==================================');

        sampleAppointments.forEach((apt, index) => {
            console.log(`\n${index + 1}. Appointment ID: ${apt._id}`);
            console.log('   Fields present:');
            
            // Check all possible field names for patient name
            const patientNameFields = [
                'patient_name', 'patientName', 'name', 
                'full_name', 'fullName', 'firstName', 'first_name'
            ];
            
            const timeSlotFields = [
                'appointment_time', 'appointmentTime', 'time', 
                'time_slot', 'timeSlot', 'slot'
            ];
            
            console.log('   🔹 Reference:', apt.reference_number || 'MISSING');
            
            // Check patient name variations
            let patientNameFound = false;
            patientNameFields.forEach(field => {
                if (apt[field]) {
                    console.log(`   🔹 Patient Name (${field}):`, apt[field]);
                    patientNameFound = true;
                }
            });
            if (!patientNameFound) {
                console.log('   ❌ Patient Name: NOT FOUND');
            }

            // Check time slot variations  
            let timeSlotFound = false;
            timeSlotFields.forEach(field => {
                if (apt[field]) {
                    console.log(`   🔹 Time Slot (${field}):`, apt[field]);
                    timeSlotFound = true;
                }
            });
            if (!timeSlotFound) {
                console.log('   ❌ Time Slot: NOT FOUND');
            }

            console.log('   🔹 Hospital:', apt.hospital || 'MISSING');
            console.log('   🔹 Date:', apt.appointment_date || apt.date || 'MISSING');
            console.log('   🔹 Status:', apt.status || 'MISSING');
            console.log('   🔹 Created:', apt.created_at || apt.createdAt || 'MISSING');
            
            // Show all available fields for debugging
            console.log('   📝 All available fields:');
            const fields = Object.keys(apt).filter(key => !key.startsWith('_'));
            fields.forEach(field => {
                if (typeof apt[field] !== 'object') {
                    console.log(`      • ${field}: ${apt[field]}`);
                }
            });
        });

        // Test the tracking API with a real reference number
        if (sampleAppointments.length > 0) {
            const testRef = sampleAppointments[0].reference_number;
            if (testRef) {
                console.log(`\n🧪 Testing tracking API with reference: ${testRef}`);
                
                try {
                    const response = await fetch(`http://localhost:3001/api/appointments/track/${testRef}`);
                    const result = await response.json();
                    
                    if (response.ok) {
                        console.log('✅ API Response successful');
                        console.log('📋 Returned patient name:', result.appointment?.patient_name || result.appointment?.patientName || 'MISSING');
                        console.log('📋 Returned time slot:', result.appointment?.appointment_time || result.appointment?.time || 'MISSING');
                        console.log('📋 Returned hospital:', result.appointment?.hospital || 'MISSING');
                    } else {
                        console.log('❌ API Error:', result.error);
                    }
                } catch (error) {
                    console.log('❌ API Test failed:', error.message);
                }
            }
        }

    } catch (error) {
        console.error('❌ Database check failed:', error);
    }

    console.log('\n===============================================');
    console.log('🎯 Analysis Summary');
    console.log('• Check if patient_name field exists in appointments');
    console.log('• Check if appointment_time field exists in appointments'); 
    console.log('• Verify field naming conventions in database');
    console.log('• Update API mapping if field names are different');
}

// Run the check
setTimeout(() => {
    checkDatabaseStructure().catch(console.error).finally(() => {
        process.exit(0);
    });
}, 1000); // Wait for server to start
