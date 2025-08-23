#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Slot from './models/Slot.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

async function deletePopularSlots() {
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

    // First, let's see how many Popular Diagnostic Centre slots exist
    console.log('\n🔍 Checking existing Popular Diagnostic Centre slots...');
    const popularSlotCount = await Slot.countDocuments({ 
      hospital_id: 'popular' 
    });
    console.log(`   Found ${popularSlotCount} slots for Popular Diagnostic Centre`);

    if (popularSlotCount === 0) {
      console.log('   No slots found to delete.');
    } else {
      // Show some sample slots before deletion
      console.log('\n📋 Sample slots to be deleted:');
      const sampleSlots = await Slot.find({ 
        hospital_id: 'popular' 
      }).limit(5).sort({ date: 1, start_time: 1 });
      
      sampleSlots.forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.date} ${slot.time_slot} (${slot.current_appointments}/${slot.max_appointments} booked)`);
      });

      // Ask for confirmation (in a real scenario you might want this, but for automation we'll proceed)
      console.log('\n🗑️ Deleting all Popular Diagnostic Centre slots...');
      
      const deleteResult = await Slot.deleteMany({ 
        hospital_id: 'popular' 
      });
      
      console.log(`✅ Successfully deleted ${deleteResult.deletedCount} slots for Popular Diagnostic Centre`);
    }

    // Verify the deletion
    console.log('\n🔍 Verifying deletion...');
    const remainingPopularSlots = await Slot.countDocuments({ 
      hospital_id: 'popular' 
    });
    console.log(`   Popular Diagnostic Centre slots remaining: ${remainingPopularSlots}`);

    // Check remaining slots by hospital
    const moonSlotCount = await Slot.countDocuments({ 
      hospital_id: 'moon' 
    });
    console.log(`   Moon Hospital slots remaining: ${moonSlotCount}`);

    const totalSlots = await Slot.countDocuments();
    console.log(`   Total slots in database: ${totalSlots}`);

  } catch (error) {
    console.error('❌ Error deleting slots:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
console.log('🚀 Starting Popular Diagnostic Centre slot deletion...\n');
deletePopularSlots();
