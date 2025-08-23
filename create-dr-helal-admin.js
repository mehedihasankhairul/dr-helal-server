import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

async function createDrHelalAdmin() {
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

    // Admin user credentials for Dr. Helal
    const adminData = {
      email: 'portal@drhelal.com',
      password: '123456',
      full_name: 'Dr. Helal Admin',
      role: 'admin',
      phone: '+8801234567890',
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
      
      // Update the existing user
      console.log('\\n🔄 Updating existing admin password...');
      existingAdmin.password_hash = await User.hashPassword(adminData.password);
      existingAdmin.full_name = adminData.full_name;
      existingAdmin.role = adminData.role;
      existingAdmin.phone = adminData.phone;
      existingAdmin.gender = adminData.gender;
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
    console.log('\\n🎉 Dr. Helal Admin User Details:');
    console.log('   - ID:', admin.id);
    console.log('   - Email:', admin.email);
    console.log('   - Name:', admin.full_name);
    console.log('   - Role:', admin.role);
    console.log('   - Phone:', admin.phone);
    console.log('   - Active:', admin.is_active);
    console.log('   - Email Verified:', admin.email_verified);
    console.log('   - Created:', admin.createdAt);
    
    console.log('\\n🔑 Login Credentials:');
    console.log('   - Email: portal@drhelal.com');
    console.log('   - Password: 123456');
    
    console.log('\\n🌐 You can now login at:');
    console.log('   - Doctor Portal: https://drhelal-server.vercel.app');
    console.log('   - Local Development: http://localhost:5173 (if running locally)');

    // Also count total users
    const totalUsers = await User.countDocuments();
    console.log('\\n📊 Database Statistics:');
    console.log('   - Total Users:', totalUsers);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   - Duplicate key error: User with this email already exists');
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createDrHelalAdmin();
