#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import Slot from './models/Slot.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

// Dr. Helal hospital configurations
const drHelalHospitals = [
  {
    id: "popular",
    name: "Popular Diagnostic Centre",
    timeSlots: [
      { start: "08:00", end: "09:00", display: "08:00 AM - 09:00 AM" },
      { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
      { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
      { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
    ],
    visitDays: [0, 1, 2, 3, 4, 6], // All days except Friday (0=Sunday, 6=Saturday)
    maxAppointments: 20
  },
  {
    id: "moon",
    name: "Moon Hospital",
    timeSlots: [
      { start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
      { start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
    ],
    visitDays: [0, 1, 2, 3, 4, 6], // All days except Friday (0=Sunday, 6=Saturday)
    maxAppointments: 20
  }
];

async function createDrHelalSlots() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB database:', mongoose.connection.name);

    // Generate slots for the next 90 days
    const startDate = dayjs();
    const endDate = startDate.add(90, 'day');
    
    let totalSlotsCreated = 0;
    let totalSlotsSkipped = 0;

    console.log(`📅 Creating slots from ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);
    
    // First, clear existing slots (optional - uncomment if you want fresh start)
    console.log('🗑️ Clearing existing slots...');
    const deleteResult = await Slot.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing slots`);

    for (const hospital of drHelalHospitals) {
      console.log(`\n🏥 Creating slots for ${hospital.name}...`);
      
      let current = startDate;
      let hospitalSlotsCreated = 0;

      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        const dateStr = current.format('YYYY-MM-DD');
        const dayOfWeek = current.day();

        // Skip Fridays and days hospital doesn't operate
        if (dayOfWeek === 5 || !hospital.visitDays.includes(dayOfWeek)) {
          console.log(`   ⏭️ Skipping ${dateStr} (${current.format('dddd')}) - Hospital closed`);
          totalSlotsSkipped++;
          current = current.add(1, 'day');
          continue;
        }

        // Check if slots already exist for this hospital and date
        const existingSlots = await Slot.countDocuments({
          hospital_id: hospital.id,
          date: dateStr
        });

        if (existingSlots > 0) {
          console.log(`   ⏭️ Skipping ${dateStr} - Slots already exist`);
          current = current.add(1, 'day');
          continue;
        }

        // Create slots for this date
        const slotsToCreate = hospital.timeSlots.map(slot => ({
          hospital_id: hospital.id,
          hospital_name: hospital.name,
          date: dateStr,
          time_slot: slot.display,
          start_time: slot.start,
          end_time: slot.end,
          max_appointments: hospital.maxAppointments,
          current_appointments: 0,
          is_available: true,
          appointment_ids: []
        }));

        try {
          await Slot.insertMany(slotsToCreate);
          hospitalSlotsCreated += slotsToCreate.length;
          totalSlotsCreated += slotsToCreate.length;
          
          if (hospitalSlotsCreated % 20 === 0) { // Progress indicator
            console.log(`   📊 Progress: ${hospitalSlotsCreated} slots created for ${hospital.name}`);
          }
        } catch (error) {
          console.error(`   ❌ Error creating slots for ${dateStr}:`, error.message);
        }

        current = current.add(1, 'day');
      }

      console.log(`✅ Created ${hospitalSlotsCreated} slots for ${hospital.name}`);
    }

    console.log(`\n🎉 Slot creation completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total slots created: ${totalSlotsCreated}`);
    console.log(`   - Days skipped (closed): ${totalSlotsSkipped}`);
    
    // Verify the created slots
    console.log(`\n🔍 Verifying created slots...`);
    for (const hospital of drHelalHospitals) {
      const count = await Slot.countDocuments({ hospital_id: hospital.id });
      console.log(`   ${hospital.name}: ${count} slots`);
      
      // Show a sample slot
      const sampleSlot = await Slot.findOne({ hospital_id: hospital.id }).sort({ date: 1, start_time: 1 });
      if (sampleSlot) {
        console.log(`   Sample slot:`, {
          hospital: sampleSlot.hospital_name,
          date: sampleSlot.date,
          time_slot: sampleSlot.time_slot,
          max_appointments: sampleSlot.max_appointments,
          current_appointments: sampleSlot.current_appointments,
          is_available: sampleSlot.is_available
        });
      }
    }

    // Test slot query
    console.log(`\n🧪 Testing slot queries...`);
    const testDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const popularSlots = await Slot.find({ 
      hospital_id: 'popular', 
      date: testDate 
    }).sort({ start_time: 1 });
    
    console.log(`📋 Popular Diagnostic Centre slots for ${testDate}:`);
    popularSlots.forEach(slot => {
      console.log(`   ${slot.time_slot} - Available: ${slot.is_available} (${slot.current_appointments}/${slot.max_appointments})`);
    });

  } catch (error) {
    console.error('❌ Error creating slots:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
console.log('🚀 Starting Dr. Helal slot creation...\n');
createDrHelalSlots();
