import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateObjectId } from './config/database.js';
import { generateReferenceNumber } from './utils/helpers.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');

try {
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority'
  });
  
  console.log('✅ Connected to MongoDB database:', mongoose.connection.name);
  
  // Create second test appointment
  const appointmentData = {
    _id: generateObjectId(),
    reference_number: generateReferenceNumber(),
    patientName: 'Sarah Ahmed',
    patientEmail: 'sarah.ahmed@example.com',
    patientPhone: '+8801234567890',
    patientAge: 28,
    patientGender: 'Female',
    patientAddress: '456 Medical Street, Dhaka, Bangladesh',
    problemDescription: 'Heart consultation and checkup',
    hospital: 'Cardiac Care Hospital',
    date: '2025-08-26',
    appointment_date: new Date('2025-08-26'),
    appointment_time: '2:00 PM',
    time: '2:00 PM',
    doctor_name: 'Dr. Helal',
    created_at: new Date(),
    updated_at: new Date(),
    status: 'pending'
  };
  
  // Insert appointment into database
  const db = mongoose.connection.db;
  const appointmentsCollection = db.collection('appointments');
  
  const result = await appointmentsCollection.insertOne(appointmentData);
  console.log('✅ Second appointment created successfully!');
  console.log('📋 Reference Number:', appointmentData.reference_number);
  console.log('🆔 Appointment ID:', result.insertedId.toString());
  
  // Get total number of appointments
  const totalAppointments = await appointmentsCollection.countDocuments();
  console.log('📊 Total appointments in database:', totalAppointments);
  
  // List all appointments
  const allAppointments = await appointmentsCollection.find({}, {
    projection: {
      reference_number: 1,
      patientName: 1,
      appointment_date: 1,
      appointment_time: 1,
      hospital: 1,
      status: 1
    }
  }).toArray();
  
  console.log('📋 All appointments:');
  allAppointments.forEach((apt, index) => {
    console.log(`  ${index + 1}. ${apt.patientName} - ${apt.reference_number} - ${apt.appointment_date.toDateString()} ${apt.appointment_time}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.connection.close();
  console.log('📡 Database connection closed');
  process.exit(0);
}
