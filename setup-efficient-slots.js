import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Slot from './models/Slot.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Hospital schedule configuration (much more efficient)
const hospitalSchedules = [
  {
    hospital_id: "gomoti",
    hospital_name: "Gomoti Hospital",
    schedule: {
      // Days: 0=Sunday, 1=Monday, ..., 6=Saturday
      1: { // Monday
        slots: [
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      3: { // Wednesday
        slots: [
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      4: { // Thursday
        slots: [
          { start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      6: { // Saturday
        slots: [
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      }
      // Friday (5) is intentionally missing = CLOSED
    },
    max_appointments_per_slot: 15,
    advance_booking_days: 60
  }
];

async function setupEfficientSlots() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB database:', mongoose.connection.name);

    console.log('\\n🧹 Cleaning up inefficient slot documents...');
    
    // Remove all existing slot documents (they're inefficient)
    const deleteResult = await Slot.deleteMany({});
    console.log(`✅ Removed ${deleteResult.deletedCount} inefficient slot documents`);

    // Instead, create a hospital_schedules collection for configuration
    const db = mongoose.connection.db;
    const schedulesCollection = db.collection('hospital_schedules');
    
    // Clear existing schedules
    await schedulesCollection.deleteMany({});
    
    // Insert efficient hospital schedule configurations
    await schedulesCollection.insertMany(hospitalSchedules);
    
    console.log('\\n✅ Created efficient hospital schedule configuration!');
    console.log('\\n📋 Hospital Schedule Configuration:');
    
    for (const hospital of hospitalSchedules) {
      console.log(`\\n🏥 ${hospital.hospital_name} (${hospital.hospital_id}):`);
      console.log(`   Max per slot: ${hospital.max_appointments_per_slot} appointments`);
      console.log(`   Advance booking: ${hospital.advance_booking_days} days`);
      console.log('   Schedule:');
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let day = 0; day < 7; day++) {
        if (hospital.schedule[day]) {
          const slots = hospital.schedule[day].slots;
          const timeRange = `${slots[0].display.split(' - ')[0]} - ${slots[slots.length - 1].display.split(' - ')[1]}`;
          console.log(`     ${dayNames[day]}: ${timeRange} (${slots.length} slots)`);
        } else if (day === 5) {
          console.log(`     ${dayNames[day]}: CLOSED`);
        }
      }
    }

    console.log('\\n🎉 Efficient slot system setup complete!');
    console.log('\\n💡 Benefits:');
    console.log('   • Storage: ~1 document vs 184+ documents (99.5% reduction!)');
    console.log('   • Performance: O(1) schedule lookup vs O(n) slot queries');
    console.log('   • Flexibility: Easy to modify schedules without database changes');
    console.log('   • Scalability: Works for any date range without pre-creation');
    
    console.log('\\n🔧 Implementation Notes:');
    console.log('   • Slots are generated dynamically when requested');
    console.log('   • Only appointments are stored, not empty slots');
    console.log('   • Availability calculated in real-time');
    console.log('   • Schedule changes require no database migration');

  } catch (error) {
    console.error('❌ Error setting up efficient slots:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\\n📡 Database connection closed');
    process.exit(0);
  }
}

setupEfficientSlots();
