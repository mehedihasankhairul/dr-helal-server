import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// MongoDB connection string (using the same as main server)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eye-appointment';

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Admin user credentials
    const adminData = {
      email: 'admin@drhelal.com',
      password: 'drhelal123',
      full_name: 'Dr. Helal Admin',
      role: 'admin',
      phone: '+91-9876543210',
      gender: 'male',
      is_active: true,
      email_verified: true
    };

    // Check if admin already exists
    console.log('🔍 Checking if admin user already exists...');
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', adminData.email);
      console.log('👤 Existing admin details:');
      console.log('   - ID:', existingAdmin.id);
      console.log('   - Email:', existingAdmin.email);
      console.log('   - Name:', existingAdmin.full_name);
      console.log('   - Role:', existingAdmin.role);
      console.log('   - Created:', existingAdmin.createdAt);
      
      // Ask if we should update the existing user
      console.log('\n🔄 Updating existing admin password...');
      existingAdmin.password_hash = await User.hashPassword(adminData.password);
      existingAdmin.full_name = adminData.full_name;
      existingAdmin.role = adminData.role;
      existingAdmin.is_active = true;
      existingAdmin.email_verified = true;
      
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      // Hash the password
      console.log('🔐 Hashing password...');
      const password_hash = await User.hashPassword(adminData.password);

      // Create the admin user
      console.log('👤 Creating admin user...');
      const adminUser = new User({
        ...adminData,
        password_hash
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    // Display final admin details
    const admin = await User.findOne({ email: adminData.email });
    console.log('\n🎉 Admin User Details:');
    console.log('   - ID:', admin.id);
    console.log('   - Email:', admin.email);
    console.log('   - Name:', admin.full_name);
    console.log('   - Role:', admin.role);
    console.log('   - Phone:', admin.phone);
    console.log('   - Active:', admin.is_active);
    console.log('   - Email Verified:', admin.email_verified);
    console.log('   - Created:', admin.createdAt);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   - Email: admin@drhelal.com');
    console.log('   - Password: drhelal123');
    
    console.log('\n🌐 You can now login at:');
    console.log('   - Doctor Portal: https://drhelal-server.vercel.app');
    console.log('   - Local Portal: http://localhost:5173 (switch to doctor portal)');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   - Duplicate key error: User with this email already exists');
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createAdminUser();
