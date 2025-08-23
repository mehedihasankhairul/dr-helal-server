#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Slot from './models/Slot.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

async function deleteGomotiSlots() {
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

    // First, let's see how many Gomoti Hospital slots exist
    console.log('\n🔍 Gomoti Hospital এর slots check করছি...');
    const gomotiSlotCount = await Slot.countDocuments({ 
      hospital_id: 'gomoti' 
    });
    console.log(`   মোট Gomoti Hospital slots পাওয়া গেছে: ${gomotiSlotCount}টা`);

    if (gomotiSlotCount === 0) {
      console.log('   কোন slots পাওয়া যায়নি delete করার জন্য।');
      return;
    }

    // Show detailed breakdown of slots by type
    console.log('\n📋 Slots breakdown:');
    
    const regularSlotCount = await Slot.countDocuments({ 
      hospital_id: 'gomoti',
      day_type: 'regular'
    });
    console.log(`   Regular slots: ${regularSlotCount}টা`);
    
    const thursdaySlotCount = await Slot.countDocuments({ 
      hospital_id: 'gomoti',
      day_type: 'thursday' 
    });
    console.log(`   Thursday slots: ${thursdaySlotCount}টা`);
    
    const templateRegularCount = await Slot.countDocuments({ 
      hospital_id: 'gomoti',
      date: 'template-regular'
    });
    console.log(`   Template regular slots: ${templateRegularCount}টা`);
    
    const templateThursdayCount = await Slot.countDocuments({ 
      hospital_id: 'gomoti',
      date: 'template-thursday'
    });
    console.log(`   Template thursday slots: ${templateThursdayCount}টা`);
    
    // Show some sample slots before deletion
    console.log('\n📋 Delete হওয়ার আগে sample slots:');
    const sampleSlots = await Slot.find({ 
      hospital_id: 'gomoti' 
    }).limit(8).sort({ date: 1, start_time: 1 });
    
    sampleSlots.forEach((slot, index) => {
      const dateDisplay = slot.date.startsWith('template') ? slot.date : slot.date;
      const bookingStatus = `(${slot.current_appointments}/${slot.max_appointments} booked)`;
      console.log(`   ${index + 1}. ${dateDisplay} - ${slot.time_slot} - ${slot.day_type} ${bookingStatus}`);
    });

    // Check for any booked appointments
    const slotsWithAppointments = await Slot.countDocuments({ 
      hospital_id: 'gomoti',
      current_appointments: { $gt: 0 }
    });
    
    if (slotsWithAppointments > 0) {
      console.log(`\n⚠️  Warning: ${slotsWithAppointments}টা slots এ appointments আছে!`);
      
      const bookedSlots = await Slot.find({ 
        hospital_id: 'gomoti',
        current_appointments: { $gt: 0 }
      }).select('date time_slot current_appointments max_appointments');
      
      console.log('   Booked slots:');
      bookedSlots.forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.date} - ${slot.time_slot} (${slot.current_appointments}/${slot.max_appointments})`);
      });
      
      console.log('\n💡 এই slots গুলো delete করলে appointments এর data inconsistent হয়ে যাবে।');
      console.log('   প্রথমে appointments cancel/reschedule করা উচিত।');
    }

    // Delete all Gomoti slots
    console.log('\n🗑️ Gomoti Hospital এর সব slots delete করছি...');
    
    const deleteResult = await Slot.deleteMany({ 
      hospital_id: 'gomoti' 
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount}টা slots for Gomoti Hospital`);

    // Verify the deletion
    console.log('\n🔍 Deletion verify করছি...');
    const remainingGomotiSlots = await Slot.countDocuments({ 
      hospital_id: 'gomoti' 
    });
    console.log(`   Gomoti Hospital slots remaining: ${remainingGomotiSlots}টা`);

    if (remainingGomotiSlots > 0) {
      console.log('⚠️  কিছু slots এখনও বাকি আছে!');
    } else {
      console.log('✅ সব Gomoti slots successfully delete হয়েছে');
    }

    // Show summary of remaining slots in database
    console.log('\n📊 Database summary:');
    const totalSlots = await Slot.countDocuments();
    console.log(`   Total slots in database: ${totalSlots}টা`);
    
    // Check other hospitals
    const moonSlotCount = await Slot.countDocuments({ 
      hospital_id: 'moon' 
    });
    if (moonSlotCount > 0) {
      console.log(`   Moon Hospital slots: ${moonSlotCount}টা`);
    }
    
    const drHelalSlotCount = await Slot.countDocuments({ 
      hospital_id: 'drhelal' 
    });
    if (drHelalSlotCount > 0) {
      console.log(`   Dr. Helal slots: ${drHelalSlotCount}টা`);
    }
    
    const popularSlotCount = await Slot.countDocuments({ 
      hospital_id: 'popular' 
    });
    if (popularSlotCount > 0) {
      console.log(`   Popular Diagnostic Centre slots: ${popularSlotCount}টা`);
    }

  } catch (error) {
    console.error('❌ Error deleting Gomoti slots:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
console.log('🚀 Gomoti Hospital slot deletion শুরু হচ্ছে...\n');
deleteGomotiSlots();
