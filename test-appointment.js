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
  
  // Create test appointment
  const appointmentData = {
    _id: generateObjectId(),
    reference_number: generateReferenceNumber(),
    patientName: 'Test Patient',
    patientEmail: 'test@example.com',
    patientPhone: '+1234567890',
    patientAge: 30,
    patientGender: 'Male',
    patientAddress: '123 Test Street, Test City',
    problemDescription: 'General checkup and consultation - Test appointment',
    hospital: 'Test Hospital',
    date: '2025-08-25',
    appointment_date: new Date('2025-08-25'),
    appointment_time: '10:00 AM',
    time: '10:00 AM',
    doctor_name: 'Dr. Helal',
    created_at: new Date(),
    updated_at: new Date(),
    status: 'pending'
  };
  
  // Insert appointment into database
  const db = mongoose.connection.db;
  const appointmentsCollection = db.collection('appointments');
  
  const result = await appointmentsCollection.insertOne(appointmentData);
  console.log('✅ Appointment created successfully!');
  console.log('📋 Reference Number:', appointmentData.reference_number);
  console.log('🆔 Appointment ID:', result.insertedId.toString());
  
  // Retrieve the created appointment to verify
  const createdAppointment = await appointmentsCollection.findOne({ _id: result.insertedId });
  console.log('📄 Created Appointment:', {
    reference_number: createdAppointment.reference_number,
    patient_name: createdAppointment.patientName,
    appointment_date: createdAppointment.appointment_date,
    appointment_time: createdAppointment.appointment_time,
    hospital: createdAppointment.hospital,
    status: createdAppointment.status
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.connection.close();
  console.log('📡 Database connection closed');
  process.exit(0);
}
