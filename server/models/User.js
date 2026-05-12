const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  
  // --- NEW: FORGOT PASSWORD FIELDS ---
  resetCode: { type: String },
  resetCodeExpires: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);