import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    console.log('\n🔍 Checking for existing admin users...');
    
    const existingAdmin1 = await User.findOne({ email: 'admin@drhelal.com' });
    const existingAdmin2 = await User.findOne({ email: 'admin@drhelalahmed.com' });
    
    console.log('👤 admin@drhelal.com exists:', !!existingAdmin1);
    console.log('👤 admin@drhelalahmed.com exists:', !!existingAdmin2);
    
    if (existingAdmin1) {
      console.log('📋 Existing admin@drhelal.com details:');
      console.log('   ID:', existingAdmin1._id.toString());
      console.log('   Email:', existingAdmin1.email);
      console.log('   Role:', existingAdmin1.role);
      console.log('   Full Name:', existingAdmin1.full_name);
    }
    
    if (existingAdmin2) {
      console.log('📋 Existing admin@drhelalahmed.com details:');
      console.log('   ID:', existingAdmin2._id.toString());
      console.log('   Email:', existingAdmin2.email);
      console.log('   Role:', existingAdmin2.role);
      console.log('   Full Name:', existingAdmin2.full_name);
    }

    // Create the new admin if it doesn't exist
    if (!existingAdmin2) {
      console.log('\n➕ Creating new admin user: admin@drhelalahmed.com...');
      
      const newAdmin = new User({
        email: 'admin@drhelalahmed.com',
        password_hash: await User.hashPassword('helal2025'),
        full_name: 'Dr. Helal Admin',
        role: 'admin',
        is_verified: true,
        created_at: new Date()
      });

      await newAdmin.save();
      console.log('✅ New admin user created successfully!');
      console.log('📋 New admin details:');
      console.log('   ID:', newAdmin._id.toString());
      console.log('   Email:', newAdmin.email);
      console.log('   Role:', newAdmin.role);
      console.log('   Full Name:', newAdmin.full_name);
    }

    // Fix the existing admin if needed (update to correct ID)
    if (existingAdmin1) {
      console.log('\n🔧 Checking if existing admin needs ID fix...');
      
      // The token expects ID: 68939ff5a66552100667ebdd
      const expectedId = '68939ff5a66552100667ebdd';
      const actualId = existingAdmin1._id.toString();
      
      if (actualId !== expectedId) {
        console.log('⚠️ Admin ID mismatch!');
        console.log('   Token expects:', expectedId);
        console.log('   Database has:', actualId);
        
        // We can't change MongoDB _id, so we need to delete and recreate
        console.log('🔄 Recreating admin with correct ID...');
        
        await User.findByIdAndDelete(existingAdmin1._id);
        console.log('🗑️ Deleted existing admin');
        
        const fixedAdmin = new User({
          _id: new mongoose.Types.ObjectId(expectedId),
          email: 'admin@drhelal.com',
          password_hash: await User.hashPassword('drhelal123'),
          full_name: 'Dr. Helal Admin',
          role: 'admin',
          is_verified: true,
          created_at: new Date()
        });

        await fixedAdmin.save();
        console.log('✅ Recreated admin with correct ID!');
      } else {
        console.log('✅ Admin ID is correct');
      }
    } else {
      // Create the original admin with the expected ID
      console.log('\n➕ Creating original admin user with expected ID...');
      
      const originalAdmin = new User({
        _id: new mongoose.Types.ObjectId('68939ff5a66552100667ebdd'),
        email: 'admin@drhelal.com',
        password_hash: await User.hashPassword('drhelal123'),
        full_name: 'Dr. Helal Admin',
        role: 'admin',
        is_verified: true,
        created_at: new Date()
      });

      await originalAdmin.save();
      console.log('✅ Original admin user created successfully!');
    }

    console.log('\n🎉 Admin setup complete!');
    console.log('\n📋 Available admin accounts:');
    console.log('1. admin@drhelal.com / drhelal123 (for existing token)');
    console.log('2. admin@drhelalahmed.com / helal2025 (new account)');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    
    if (error.code === 11000) {
      console.log('⚠️ User already exists, checking details...');
      const existing = await User.findOne({ 
        $or: [
          { email: 'admin@drhelal.com' },
          { email: 'admin@drhelalahmed.com' }
        ]
      });
      if (existing) {
        console.log('📋 Existing user:');
        console.log('   ID:', existing._id.toString());
        console.log('   Email:', existing.email);
        console.log('   Role:', existing.role);
      }
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 Database connection closed');
  }
}

// Run the script
createAdmin();
