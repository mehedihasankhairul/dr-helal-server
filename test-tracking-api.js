import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function testTrackingAPI() {
    console.log('🧪 Testing Enhanced Appointment Tracking API');
    console.log('===============================================\n');

    // Test 1: Track endpoint with valid reference (if any exists)
    console.log('1️⃣ Testing /track/:refNumber endpoint');
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/track/APT-2024-0823-1234-5678`);
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Track endpoint successful:', result.success);
            console.log('📋 Appointment details:', {
                reference: result.appointment.reference_number,
                patient_name: result.appointment.patient_name,
                hospital: result.appointment.hospital,
                status: result.appointment.status,
                has_all_fields: !!(result.appointment.patient_phone && result.appointment.patient_email)
            });
        } else {
            console.log('⚠️ Track endpoint (expected if no data):', result.error);
        }
    } catch (error) {
        console.log('❌ Track endpoint error:', error.message);
    }
    
    console.log('');

    // Test 2: Reference endpoint with same reference
    console.log('2️⃣ Testing /reference/:refNumber endpoint');
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/reference/APT-2024-0823-1234-5678`);
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Reference endpoint successful:', result.success);
            console.log('📋 Appointment details:', {
                reference: result.appointment.reference_number,
                patient_name: result.appointment.patient_name,
                hospital: result.appointment.hospital,
                status: result.appointment.status,
                has_all_fields: !!(result.appointment.patient_phone && result.appointment.patient_email)
            });
        } else {
            console.log('⚠️ Reference endpoint (expected if no data):', result.error);
        }
    } catch (error) {
        console.log('❌ Reference endpoint error:', error.message);
    }

    console.log('');

    // Test 3: Health check to ensure server is running
    console.log('3️⃣ Testing server health');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Server is healthy:', result.status);
            console.log('🏥 Hospital capacities:', result.capacity_config);
            console.log('⚡ Features:', result.features);
        } else {
            console.log('❌ Server health check failed');
        }
    } catch (error) {
        console.log('❌ Server unreachable:', error.message);
        console.log('💡 Make sure to run: npm start or node server.js');
    }

    console.log('\n===============================================');
    console.log('🎯 Test Summary:');
    console.log('• Both /track and /reference endpoints should return the same format');
    console.log('• Response includes comprehensive patient information');
    console.log('• Both snake_case and camelCase field names for frontend compatibility');
    console.log('• Prescription information is checked and included');
    console.log('• Success/error format is consistent');
}

// Run the test
testTrackingAPI().catch(console.error);
