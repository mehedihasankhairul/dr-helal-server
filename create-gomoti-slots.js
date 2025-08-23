#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Slot from './models/Slot.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

// Gomoti Hospital configuration
const gomotiHospital = {
  id: "gomoti",
  name: "Gomoti Hospital",
  maxAppointments: 20,
  
  // Time slots by day
  timeSlots: {
    // সাধারণ দিন (রবি, সোম, মঙ্গল, বুধ, শনি): 5PM-10PM
    regular: [
      { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
      { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
      { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
      { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
      { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
    ],
    
    // বৃহস্পতিবার: 4PM-10PM
    thursday: [
      { start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
      { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
      { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
      { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
      { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
      { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
    ]
  },
  
  // Operating days (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 6=Saturday)
  // Friday (5) is closed
  operatingDays: [0, 1, 2, 3, 4, 6]
};

async function createGomotiSlots() {
  try {
    // Connect to MongoDB
    console.log('🔗 MongoDB তে connect হচ্ছে...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ MongoDB database এ connected:', mongoose.connection.name);

    // প্রথমে existing Gomoti slots delete করি
    console.log('\n🗑️ Gomoti Hospital এর পুরানো slots delete করছি...');
    const deleteResult = await Slot.deleteMany({ hospital_id: 'gomoti' });
    console.log(`   ${deleteResult.deletedCount}টা slots delete হয়েছে`);

    let totalSlotsCreated = 0;

    console.log('\n🏥 Gomoti Hospital এর slots তৈরি করছি...');
    
    // Regular slots (সাধারণ দিনের জন্য - 5PM to 10PM)
    console.log('📅 সাধারণ দিনের slots (5PM-10PM):');
    for (const slot of gomotiHospital.timeSlots.regular) {
      const slotData = {
        hospital_id: gomotiHospital.id,
        hospital_name: gomotiHospital.name,
        date: "template-regular", // Template indicator
        time_slot: slot.display,
        start_time: slot.start,
        end_time: slot.end,
        max_appointments: gomotiHospital.maxAppointments,
        current_appointments: 0,
        is_available: true,
        appointment_ids: [],
        day_type: 'regular' // Custom field to identify slot type
      };
      
      await Slot.create(slotData);
      totalSlotsCreated++;
      console.log(`   ✅ ${slot.display}`);
    }

    // Thursday slots (বৃহস্পতিবারের জন্য - 4PM to 10PM)
    console.log('\n📅 বৃহস্পতিবারের slots (4PM-10PM):');
    for (const slot of gomotiHospital.timeSlots.thursday) {
      const slotData = {
        hospital_id: gomotiHospital.id,
        hospital_name: gomotiHospital.name,
        date: "template-thursday", // Template indicator
        time_slot: slot.display,
        start_time: slot.start,
        end_time: slot.end,
        max_appointments: gomotiHospital.maxAppointments,
        current_appointments: 0,
        is_available: true,
        appointment_ids: [],
        day_type: 'thursday' // Custom field to identify slot type
      };
      
      await Slot.create(slotData);
      totalSlotsCreated++;
      console.log(`   ✅ ${slot.display}`);
    }

    console.log(`\n🎉 Total ${totalSlotsCreated}টা slots তৈরি হয়েছে!`);
    
    // Verification
    console.log('\n🔍 Verification:');
    const regularSlots = await Slot.countDocuments({ 
      hospital_id: 'gomoti', 
      day_type: 'regular' 
    });
    const thursdaySlots = await Slot.countDocuments({ 
      hospital_id: 'gomoti', 
      day_type: 'thursday' 
    });
    
    console.log(`   Regular slots: ${regularSlots}টা`);
    console.log(`   Thursday slots: ${thursdaySlots}টা`);
    console.log(`   Total Gomoti slots: ${regularSlots + thursdaySlots}টা`);

    // Show sample slots
    console.log('\n📋 Sample slots:');
    const sampleRegular = await Slot.findOne({ day_type: 'regular' });
    const sampleThursday = await Slot.findOne({ day_type: 'thursday' });
    
    console.log('   Regular:', sampleRegular.time_slot);
    console.log('   Thursday:', sampleThursday.time_slot);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
console.log('🚀 Gomoti Hospital slots তৈরি করা শুরু...\n');
createGomotiSlots();
