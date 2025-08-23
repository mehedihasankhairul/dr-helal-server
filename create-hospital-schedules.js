import mongoose from 'mongoose';

// Create hospital schedule documents in database
async function createHospitalSchedules() {
    console.log('🏥 Creating Hospital Schedule Documents...\n');
    
    try {
        // Connect to database
        await mongoose.connect('mongodb://localhost:27017/doctor-helal');
        console.log('✅ Connected to database\n');
        
        const db = mongoose.connection.db;
        const hospitalSchedulesCollection = db.collection('hospital_schedules');
        
        // Clear existing schedules
        await hospitalSchedulesCollection.deleteMany({});
        console.log('🧹 Cleared existing hospital schedules\n');
        
        // Gomoti Hospital Schedule
        const gomotiSchedule = {
            _id: new mongoose.Types.ObjectId(), // MongoDB ObjectId
            hospital_id: "gomoti",
            hospital_name: "Gomoti Hospital",
            schedule: {
                1: { // Monday
                    start_time: "17:00", // 5:00 PM
                    end_time: "22:00",   // 10:00 PM  
                    slot_duration: 60,   // 1 hour slots
                    slots: [
                        "05:00 PM - 06:00 PM",
                        "06:00 PM - 07:00 PM", 
                        "07:00 PM - 08:00 PM",
                        "08:00 PM - 09:00 PM",
                        "09:00 PM - 10:00 PM"
                    ]
                },
                3: { // Wednesday
                    start_time: "17:00", // 5:00 PM
                    end_time: "22:00",   // 10:00 PM
                    slot_duration: 60,
                    slots: [
                        "05:00 PM - 06:00 PM",
                        "06:00 PM - 07:00 PM",
                        "07:00 PM - 08:00 PM", 
                        "08:00 PM - 09:00 PM",
                        "09:00 PM - 10:00 PM"
                    ]
                },
                4: { // Thursday  
                    start_time: "16:00", // 4:00 PM
                    end_time: "22:00",   // 10:00 PM
                    slot_duration: 60,
                    slots: [
                        "04:00 PM - 05:00 PM",
                        "05:00 PM - 06:00 PM", 
                        "06:00 PM - 07:00 PM",
                        "07:00 PM - 08:00 PM",
                        "08:00 PM - 09:00 PM",
                        "09:00 PM - 10:00 PM"
                    ]
                },
                6: { // Saturday
                    start_time: "17:00", // 5:00 PM
                    end_time: "22:00",   // 10:00 PM
                    slot_duration: 60,
                    slots: [
                        "05:00 PM - 06:00 PM",
                        "06:00 PM - 07:00 PM",
                        "07:00 PM - 08:00 PM",
                        "08:00 PM - 09:00 PM", 
                        "09:00 PM - 10:00 PM"
                    ]
                }
            },
            max_appointments_per_slot: 25, // Updated to 25
            advance_booking_days: 60,
            doctor_name: "Dr. Helal",
            created_at: new Date(),
            updated_at: new Date(),
            is_active: true
        };
        
        // Al-Sefa Hospital Schedule
        const alsefaSchedule = {
            _id: new mongoose.Types.ObjectId(),
            hospital_id: "alsefa", 
            hospital_name: "Al-Sefa Hospital",
            schedule: {
                0: { // Sunday
                    start_time: "09:00", // 9:00 AM
                    end_time: "12:00",   // 12:00 PM
                    slot_duration: 60,
                    slots: [
                        "09:00 AM - 10:00 AM",
                        "10:00 AM - 11:00 AM",
                        "11:00 AM - 12:00 PM"
                    ]
                },
                1: { // Monday
                    start_time: "09:00",
                    end_time: "12:00", 
                    slot_duration: 60,
                    slots: [
                        "09:00 AM - 10:00 AM",
                        "10:00 AM - 11:00 AM", 
                        "11:00 AM - 12:00 PM"
                    ]
                },
                2: { // Tuesday
                    start_time: "09:00",
                    end_time: "12:00",
                    slot_duration: 60,
                    slots: [
                        "09:00 AM - 10:00 AM",
                        "10:00 AM - 11:00 AM",
                        "11:00 AM - 12:00 PM" 
                    ]
                },
                3: { // Wednesday
                    start_time: "09:00",
                    end_time: "12:00", 
                    slot_duration: 60,
                    slots: [
                        "09:00 AM - 10:00 AM",
                        "10:00 AM - 11:00 AM",
                        "11:00 AM - 12:00 PM"
                    ]
                },
                4: { // Thursday
                    start_time: "09:00",
                    end_time: "12:00",
                    slot_duration: 60, 
                    slots: [
                        "09:00 AM - 10:00 AM",
                        "10:00 AM - 11:00 AM",
                        "11:00 AM - 12:00 PM"
                    ]
                },
                6: { // Saturday
                    start_time: "09:00",
                    end_time: "12:00",
                    slot_duration: 60,
                    slots: [
                        "09:00 AM - 10:00 AM", 
                        "10:00 AM - 11:00 AM",
                        "11:00 AM - 12:00 PM"
                    ]
                }
            },
            max_appointments_per_slot: 25, // 25 appointments per slot
            advance_booking_days: 60,
            doctor_name: "Dr. Helal",
            created_at: new Date(),
            updated_at: new Date(), 
            is_active: true
        };

        // Moon Hospital Schedule  
        const moonSchedule = {
            _id: new mongoose.Types.ObjectId(),
            hospital_id: "moon",
            hospital_name: "Moon Hospital", 
            schedule: {
                0: { // Sunday
                    start_time: "15:00", // 3:00 PM
                    end_time: "17:00",   // 5:00 PM
                    slot_duration: 60,
                    slots: [
                        "03:00 PM - 04:00 PM",
                        "04:00 PM - 05:00 PM"
                    ]
                },
                1: { // Monday
                    start_time: "15:00",
                    end_time: "17:00", 
                    slot_duration: 60,
                    slots: [
                        "03:00 PM - 04:00 PM",
                        "04:00 PM - 05:00 PM" 
                    ]
                },
                2: { // Tuesday
                    start_time: "15:00",
                    end_time: "17:00",
                    slot_duration: 60,
                    slots: [
                        "03:00 PM - 04:00 PM",
                        "04:00 PM - 05:00 PM"
                    ]
                },
                3: { // Wednesday
                    start_time: "15:00", 
                    end_time: "17:00",
                    slot_duration: 60,
                    slots: [
                        "03:00 PM - 04:00 PM",
                        "04:00 PM - 05:00 PM"
                    ]
                },
                4: { // Thursday
                    start_time: "15:00",
                    end_time: "17:00",
                    slot_duration: 60,
                    slots: [
                        "03:00 PM - 04:00 PM",
                        "04:00 PM - 05:00 PM"
                    ]
                },
                6: { // Saturday
                    start_time: "15:00",
                    end_time: "17:00",
                    slot_duration: 60,
                    slots: [
                        "03:00 PM - 04:00 PM", 
                        "04:00 PM - 05:00 PM"
                    ]
                }
            },
            max_appointments_per_slot: 25, // 25 appointments per slot
            advance_booking_days: 60,
            doctor_name: "Dr. Helal",
            created_at: new Date(),
            updated_at: new Date(),
            is_active: true
        };
        
        // Insert all hospital schedules
        const result = await hospitalSchedulesCollection.insertMany([
            gomotiSchedule, 
            alsefaSchedule,
            moonSchedule
        ]);
        
        console.log('✅ Successfully created hospital schedules:');
        console.log(`🏥 Gomoti Hospital: ${gomotiSchedule._id}`);
        console.log(`🏥 Al-Sefa Hospital: ${alsefaSchedule._id}`);
        console.log(`🏥 Moon Hospital: ${moonSchedule._id}\n`);
        
        // Verify the inserted data
        const schedules = await hospitalSchedulesCollection.find({}).toArray();
        
        console.log('📋 Hospital Schedules Summary:');
        console.log('================================');
        
        schedules.forEach(schedule => {
            const workingDays = Object.keys(schedule.schedule).length;
            const totalSlots = Object.values(schedule.schedule).reduce((total, day) => {
                return total + (day.slots ? day.slots.length : 0);
            }, 0);
            const weeklyCapacity = totalSlots * schedule.max_appointments_per_slot;
            
            console.log(`\n🏥 ${schedule.hospital_name} (${schedule.hospital_id}):`);
            console.log(`   Working Days: ${workingDays} days/week`);
            console.log(`   Total Weekly Slots: ${totalSlots}`);
            console.log(`   Max Per Slot: ${schedule.max_appointments_per_slot} patients`);
            console.log(`   Weekly Capacity: ${weeklyCapacity} appointments`);
            console.log(`   Doctor: ${schedule.doctor_name}`);
        });
        
        console.log('\n🎉 Hospital schedules created successfully!');
        console.log('💡 These schedules will be cached on client-side to avoid repeated server calls.');
        
    } catch (error) {
        console.error('❌ Error creating hospital schedules:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

createHospitalSchedules();
