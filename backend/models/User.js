const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  level:     { type: String, default: 'beginner' },
  badges:    [String],
  // Role field — backward compatible (existing users default to 'student').
  // To make a user admin, run in MongoDB shell:
  //   db.users.updateOne({ email: 'your@email.com' }, { $set: { role: 'admin' } })
  role:      { type: String, enum: ['student', 'admin'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);