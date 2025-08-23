import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function deleteMoonHospitalSlots() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🚀 Moon Hospital slot deletion শুরু হচ্ছে...\n');
    
    // Connect to MongoDB
    console.log('🔗 MongoDB তে connect হচ্ছে...');
    await client.connect();
    const db = client.db();
    console.log('✅ MongoDB database এ connected:', db.databaseName);
    
    const slotsCollection = db.collection('slots');
    
    // Count existing Moon Hospital slots
    console.log('\n🔍 Moon Hospital এর slots check করছি...');
    const totalMoonSlots = await slotsCollection.countDocuments({ hospital_id: 'moon' });
    console.log(`   মোট Moon Hospital slots পাওয়া গেছে: ${totalMoonSlots}টা\n`);
    
    if (totalMoonSlots === 0) {
      console.log('ℹ️ কোন Moon Hospital slots পাওয়া যায়নি।');
      return;
    }
    
    // Get breakdown of slot types
    const regularSlots = await slotsCollection.countDocuments({ 
      hospital_id: 'moon', 
      day_type: { $ne: 'thursday' }
    });
    const thursdaySlots = await slotsCollection.countDocuments({ 
      hospital_id: 'moon', 
      day_type: 'thursday' 
    });
    const templateRegularSlots = await slotsCollection.countDocuments({ 
      hospital_id: 'moon', 
      date: { $regex: /^template-/ },
      day_type: { $ne: 'thursday' }
    });
    const templateThursdaySlots = await slotsCollection.countDocuments({ 
      hospital_id: 'moon', 
      date: { $regex: /^template-/ },
      day_type: 'thursday'
    });
    
    console.log('📋 Slots breakdown:');
    console.log(`   Regular slots: ${regularSlots}টা`);
    console.log(`   Thursday slots: ${thursdaySlots}টা`);
    console.log(`   Template regular slots: ${templateRegularSlots}টা`);
    console.log(`   Template thursday slots: ${templateThursdaySlots}টা\n`);
    
    // Show sample slots before deletion
    const sampleSlots = await slotsCollection.find({ hospital_id: 'moon' }).limit(8).toArray();
    console.log('📋 Delete হওয়ার আগে sample slots:');
    sampleSlots.forEach((slot, index) => {
      const bookedCount = slot.booked_appointments ? slot.booked_appointments.length : 0;
      const maxAppointments = slot.max_appointments || 20;
      console.log(`   ${index + 1}. ${slot.date} - ${slot.start_time} - ${slot.end_time} - ${slot.day_type || 'regular'} (${bookedCount}/${maxAppointments} booked)`);
    });
    
    // Check for booked appointments
    const slotsWithBookings = await slotsCollection.find({
      hospital_id: 'moon',
      $or: [
        { 'booked_appointments.0': { $exists: true } },
        { booked_count: { $gt: 0 } }
      ]
    }).toArray();
    
    if (slotsWithBookings.length > 0) {
      console.log('\n⚠️  WARNING: কিছু slots এ booked appointments আছে:');
      slotsWithBookings.forEach(slot => {
        const bookedCount = slot.booked_appointments ? slot.booked_appointments.length : slot.booked_count || 0;
        console.log(`   - ${slot.date} ${slot.start_time}-${slot.end_time}: ${bookedCount} appointments`);
      });
      console.log('\n   এই slots delete করলে appointment data হারিয়ে যেতে পারে!');
    }
    
    console.log('\n🗑️ Moon Hospital এর সব slots delete করছি...');
    
    // Delete all Moon Hospital slots
    const deleteResult = await slotsCollection.deleteMany({ hospital_id: 'moon' });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount}টা slots for Moon Hospital\n`);
    
    // Verify deletion
    console.log('🔍 Deletion verify করছি...');
    const remainingMoonSlots = await slotsCollection.countDocuments({ hospital_id: 'moon' });
    console.log(`   Moon Hospital slots remaining: ${remainingMoonSlots}টা`);
    
    if (remainingMoonSlots === 0) {
      console.log('✅ সব Moon slots successfully delete হয়েছে\n');
    } else {
      console.log('❌ কিছু Moon slots এখনও আছে!\n');
    }
    
    // Show final database summary
    const totalSlots = await slotsCollection.countDocuments();
    const gomotiSlots = await slotsCollection.countDocuments({ hospital_id: 'gomoti' });
    
    console.log('📊 Database summary:');
    console.log(`   Total slots in database: ${totalSlots}টা`);
    console.log(`   Gomoti Hospital slots: ${gomotiSlots}টা`);
    
  } catch (error) {
    console.error('❌ Error deleting Moon Hospital slots:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the deletion
deleteMoonHospitalSlots();
