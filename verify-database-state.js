import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

async function checkDatabaseState() {
    console.log('🔍 Checking database state after slot cleanup...\n');
    
    try {
        await mongoose.connect('mongodb://localhost:27017/appointment-db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const db = mongoose.connection.db;
        
        // Check slots collection
        const slotsCount = await db.collection('slots').countDocuments();
        console.log(`📊 Total slots in database: ${slotsCount}`);
        
        if (slotsCount > 0) {
            console.log('⚠️  WARNING: Found remaining slot records!');
            
            // Show breakdown by hospital
            const slotsByHospital = await db.collection('slots').aggregate([
                {
                    $group: {
                        _id: '$hospital',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();
            
            console.log('\n📋 Slots by hospital:');
            slotsByHospital.forEach(hospital => {
                console.log(`   ${hospital._id}: ${hospital.count} slots`);
            });
            
            // Show some sample records
            const sampleSlots = await db.collection('slots').find({}).limit(3).toArray();
            console.log('\n📝 Sample slot records:');
            sampleSlots.forEach((slot, index) => {
                console.log(`   ${index + 1}. ${slot.hospital} - ${slot.date} - ${slot.time}`);
            });
        } else {
            console.log('✅ Perfect! No slot records found in database');
        }
        
        // Check appointments to ensure they still exist
        const appointmentsCount = await db.collection('appointments').countDocuments();
        console.log(`\n👥 Total appointments in database: ${appointmentsCount}`);
        
        if (appointmentsCount > 0) {
            const appointmentsByHospital = await db.collection('appointments').aggregate([
                {
                    $group: {
                        _id: '$hospital',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();
            
            console.log('\n📋 Appointments by hospital:');
            appointmentsByHospital.forEach(hospital => {
                console.log(`   ${hospital._id}: ${hospital.count} appointments`);
            });
        }
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📁 Database collections:');
        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });
        
        console.log('\n✅ Database state verification completed!');
        
    } catch (error) {
        console.error('❌ Error checking database state:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkDatabaseState();
