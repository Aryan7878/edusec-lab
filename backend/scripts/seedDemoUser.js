/**
 * seedDemoUser.js
 * Creates the demo user (demo@edusec.com / demo123) if it doesn't already exist.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusec-labs';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const existing = await User.findOne({ email: 'demo@edusec.com' });
  if (existing) {
    // Ensure the password is correct (re-hash and update)
    const salt = await bcrypt.genSalt(10);
    existing.password = await bcrypt.hash('demo123', salt);
    await existing.save();
    console.log('✅ Demo user already existed — password reset to demo123');
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);
    await User.create({
      username: 'demo',
      email: 'demo@edusec.com',
      password: hashedPassword,
      level: 'beginner',
      badges: []
    });
    console.log('✅ Demo user created: demo@edusec.com / demo123');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
