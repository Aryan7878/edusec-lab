const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const User = require('../models/User');

const ctfController = require('../controllers/ctf.controller');

async function runTests() {
  console.log('🧪 Starting CTF Flag System Integration Tests...');
  
  // 1. Database Connection
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusec-labs';
  await mongoose.connect(uri);
  console.log('🔌 Connected to MongoDB for testing.');

  // Clean up any duplicate correct submissions in the database to prevent index build failures
  console.log('🧹 Deduplicating any existing correct submissions...');
  const duplicates = await Submission.aggregate([
    { $match: { isCorrect: true } },
    {
      $group: {
        _id: { userId: '$userId', challengeId: '$challengeId' },
        count: { $sum: 1 },
        ids: { $push: '$_id' }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  for (const group of duplicates) {
    const toDelete = group.ids.slice(1);
    await Submission.deleteMany({ _id: { $in: toDelete } });
    console.log(`🗑️ Removed ${toDelete.length} duplicate correct submissions for User: ${group._id.userId}, Challenge: ${group._id.challengeId}`);
  }

  // Build/sync indexes to ensure the new partial unique index exists in the database
  console.log('🔄 Syncing database indexes...');
  await Submission.syncIndexes();

  // 2. Setup Mock Data
  console.log('🧹 Cleaning up any previous test artifacts...');
  const testEmail = 'ctf_test_user@edusec.local';
  
  // Clean up existing test user
  await User.deleteMany({ email: testEmail });
  
  // Create Test User
  const user = await User.create({
    username: 'ctftestuser',
    email: testEmail,
    password: 'testpassword123',
    level: 'beginner',
    role: 'student'
  });
  console.log('👤 Created test user:', user.username);

  // Clean up test challenges
  const testTitle = 'Test Buffer Overflow';
  await Challenge.deleteMany({ title: testTitle });
  
  // Create Test Challenge
  const flagText = 'EDUSEC{test_buffer_overflow_success}';
  const hashedFlag = await bcrypt.hash(flagText, 10);
  const challenge = await Challenge.create({
    title: testTitle,
    description: 'Find the flag by overflowing the stack buffer.',
    category: 'Web Security',
    difficulty: 'easy',
    points: 100,
    flag: hashedFlag,
    hint: 'Check the boundary limits'
  });
  console.log('🚩 Created test challenge:', challenge.title);

  // Clean up test submissions
  await Submission.deleteMany({ userId: user._id });

  // Helper mock res/req objects to simulate controller execution
  const createMockResponse = () => {
    const res = {
      statusCode: 200,
      jsonPayload: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.jsonPayload = payload;
        return this;
      }
    };
    return res;
  };

  // ─── Test 1: Submit Incorrect Flag ───
  console.log('\n👉 Test 1: Submitting incorrect flag...');
  const req1 = {
    user: { _id: user._id },
    body: {
      challengeId: challenge._id.toString(),
      flag: 'EDUSEC{wrong_flag_123}'
    }
  };
  const res1 = createMockResponse();
  await ctfController.submitFlag(req1, res1);

  if (res1.jsonPayload && res1.jsonPayload.correct === false) {
    console.log('✅ Test 1 Passed: Correctly identified incorrect flag.');
  } else {
    console.error('❌ Test 1 Failed:', res1.jsonPayload);
    process.exit(1);
  }

  // Verify submission stored in DB
  const sub1 = await Submission.findOne({ userId: user._id, isCorrect: false });
  if (sub1) {
    console.log('✅ Test 1 DB Verification: Incorrect submission record successfully written.');
  } else {
    console.error('❌ Test 1 DB Verification: No submission record found.');
    process.exit(1);
  }

  // ─── Test 2: Submit Correct Flag ───
  console.log('\n👉 Test 2: Submitting correct flag...');
  const req2 = {
    user: { _id: user._id },
    body: {
      challengeId: challenge._id.toString(),
      flag: flagText
    }
  };
  const res2 = createMockResponse();
  await ctfController.submitFlag(req2, res2);

  if (res2.jsonPayload && res2.jsonPayload.correct === true && res2.jsonPayload.pointsAwarded === 100) {
    console.log('✅ Test 2 Passed: Correctly identified correct flag and awarded points.');
  } else {
    console.error('❌ Test 2 Failed:', res2.jsonPayload);
    process.exit(1);
  }

  // Verify submission stored in DB
  const sub2 = await Submission.findOne({ userId: user._id, isCorrect: true });
  if (sub2 && sub2.pointsAwarded === 100) {
    console.log('✅ Test 2 DB Verification: Correct submission and score stored.');
  } else {
    console.error('❌ Test 2 DB Verification: Correct submission data incorrect or missing.');
    process.exit(1);
  }

  // ─── Test 3: Submit Correct Flag Again (Idempotency) ───
  console.log('\n👉 Test 3: Submitting correct flag again (expect duplicate prevention)...');
  const req3 = {
    user: { _id: user._id },
    body: {
      challengeId: challenge._id.toString(),
      flag: flagText
    }
  };
  const res3 = createMockResponse();
  await ctfController.submitFlag(req3, res3);

  if (res3.jsonPayload && res3.jsonPayload.alreadySolved === true && res3.jsonPayload.pointsAwarded === 0) {
    console.log('✅ Test 3 Passed: Correctly identified duplicate submission and awarded 0 points.');
  } else {
    console.error('❌ Test 3 Failed:', res3.jsonPayload);
    process.exit(1);
  }

  // ─── Test 4: Database Unique Constraint Violation Check ───
  console.log('\n👉 Test 4: Testing database compound partial unique index constraint...');
  try {
    // Attempt to manually bypass controller and insert a duplicate correct submission
    await Submission.create({
      userId: user._id,
      challengeId: challenge._id,
      isCorrect: true,
      pointsAwarded: 100
    });
    console.error('❌ Test 4 Failed: Database allowed inserting duplicate correct submission!');
    process.exit(1);
  } catch (err) {
    if (err.code === 11000) {
      console.log('✅ Test 4 Passed: MongoDB successfully enforced partial unique index and blocked duplicate.');
    } else {
      console.error('❌ Test 4 Failed with unexpected error:', err);
      process.exit(1);
    }
  }

  // Clean up test data
  console.log('\n🧹 Cleaning up test users, challenges, and submissions...');
  await User.deleteOne({ _id: user._id });
  await Challenge.deleteOne({ _id: challenge._id });
  await Submission.deleteMany({ userId: user._id });

  console.log('\n🎉 ALL CTF SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Unexpected error running tests:', err);
  process.exit(1);
});
