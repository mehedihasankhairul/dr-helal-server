import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Slot from './models/Slot.js';
import dayjs from 'dayjs';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Gomoti Hospital configuration
const gomotiHospital = {
  id: "gomoti",
  name: "Gomoti Hospital",
  visitDays: [6, 1, 3, 4], // Saturday(6), Monday(1), Wednesday(3), Thursday(4)
  timeSlots: {
    // Saturday, Monday, Wednesday: 5:00 PM to 10:00 PM (1-hour slots)
    regular: [
      { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
      { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
      { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
      { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
      { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
    ],
    // Thursday: 4:00 PM to 10:00 PM (1-hour slots)
    thursday: [
      { start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
      { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
      { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
      { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
      { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
      { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
    ]
  }
};

async function addGomotiSlots() {
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

    console.log('\\n🏥 Adding Gomoti Hospital Slots');
    console.log('================================');
    console.log('📅 Schedule:');
    console.log('   Saturday: 05:00 PM to 10:00 PM');
    console.log('   Monday: 05:00 PM to 10:00 PM');
    console.log('   Wednesday: 05:00 PM to 10:00 PM');
    console.log('   Thursday: 04:00 PM to 10:00 PM');
    console.log('   Friday: CLOSED');

    // Check if Gomoti Hospital slots already exist
    const existingSlots = await Slot.countDocuments({ hospital_id: gomotiHospital.id });
    if (existingSlots > 0) {
      console.log(`\\n⚠️  Found ${existingSlots} existing Gomoti Hospital slots`);
      console.log('🔄 Removing existing slots first...');
      await Slot.deleteMany({ hospital_id: gomotiHospital.id });
      console.log('✅ Existing slots removed');
    }

    // Create slots for the next 60 days
    const today = dayjs();
    const endDate = today.add(60, 'days');
    let totalSlotsCreated = 0;

    console.log(`\\n📅 Creating slots from ${today.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);

    let currentDate = today;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayOfWeek = currentDate.day(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const dayName = currentDate.format('dddd');

      // Check if this day is a visit day for Gomoti Hospital
      if (gomotiHospital.visitDays.includes(dayOfWeek)) {
        // Determine which time slots to use
        let timeSlots;
        if (dayOfWeek === 4) { // Thursday
          timeSlots = gomotiHospital.timeSlots.thursday;
        } else { // Saturday, Monday, Wednesday
          timeSlots = gomotiHospital.timeSlots.regular;
        }

        // Create slots for this date
        const slotsToCreate = [];
        
        for (const slot of timeSlots) {
          const slotData = {
            hospital_id: gomotiHospital.id,
            hospital_name: gomotiHospital.name,
            date: dateStr,
            time_slot: slot.display,
            start_time: slot.start,
            end_time: slot.end,
            max_appointments: 15, // Reasonable limit per slot
            current_appointments: 0,
            is_available: true,
            appointment_ids: []
          };
          
          slotsToCreate.push(new Slot(slotData));
        }

        // Save all slots for this date
        await Slot.insertMany(slotsToCreate);
        totalSlotsCreated += slotsToCreate.length;
        
        console.log(`   ✅ ${dayName} ${dateStr}: Created ${slotsToCreate.length} slots`);
      } else if (dayOfWeek === 5) {
        // Friday - explicitly mention it's closed
        console.log(`   🚫 ${dayName} ${dateStr}: CLOSED (No slots)`);
      } else {
        // Other days (Sunday, Tuesday) - not mentioned in schedule
        console.log(`   ⏭️  ${dayName} ${dateStr}: Not in schedule`);
      }

      currentDate = currentDate.add(1, 'day');
    }

    // Summary statistics
    console.log(`\\n✅ Successfully created ${totalSlotsCreated} slots for Gomoti Hospital`);
    
    // Show statistics by day
    console.log('\\n📊 Slot Statistics by Day:');
    const dayStats = {
      Saturday: { slots: 0, day: 6 },
      Monday: { slots: 0, day: 1 },
      Wednesday: { slots: 0, day: 3 },
      Thursday: { slots: 0, day: 4 }
    };

    for (const [dayName, info] of Object.entries(dayStats)) {
      let currentDate = today;
      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        if (currentDate.day() === info.day) {
          if (dayName === 'Thursday') {
            info.slots += 6; // Thursday has 6 slots (4-10 PM)
          } else {
            info.slots += 5; // Other days have 5 slots (5-10 PM)
          }
        }
        currentDate = currentDate.add(1, 'day');
      }
      console.log(`   ${dayName}: ${info.slots} slots`);
    }

    // Show next few days
    console.log('\\n📅 Next 7 Days Schedule:');
    for (let i = 0; i < 7; i++) {
      const checkDate = today.add(i, 'days');
      const dateStr = checkDate.format('YYYY-MM-DD');
      const dayName = checkDate.format('dddd');
      const dayOfWeek = checkDate.day();

      const slotsCount = await Slot.countDocuments({
        hospital_id: gomotiHospital.id,
        date: dateStr
      });

      let status;
      if (dayOfWeek === 5) {
        status = '🚫 CLOSED (Friday)';
      } else if (gomotiHospital.visitDays.includes(dayOfWeek)) {
        if (dayOfWeek === 4) {
          status = `✅ ${slotsCount} slots (04:00 PM - 10:00 PM)`;
        } else {
          status = `✅ ${slotsCount} slots (05:00 PM - 10:00 PM)`;
        }
      } else {
        status = '⏭️  Not scheduled';
      }

      console.log(`   ${dateStr} (${dayName}): ${status}`);
    }

    console.log('\\n🎉 Gomoti Hospital slots added successfully!');
    console.log('\\n💡 Summary:');
    console.log(`   • Total slots created: ${totalSlotsCreated}`);
    console.log('   • Each slot can accommodate up to 15 appointments');
    console.log('   • Saturday/Monday/Wednesday: 5:00 PM - 10:00 PM (5 slots)');
    console.log('   • Thursday: 4:00 PM - 10:00 PM (6 slots)');
    console.log('   • Friday: CLOSED');
    console.log('   • Slots available for next 60 days');

  } catch (error) {
    console.error('❌ Error adding Gomoti Hospital slots:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\\n📡 Database connection closed');
    process.exit(0);
  }
}

// Run the script
addGomotiSlots();
