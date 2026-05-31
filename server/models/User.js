const mongoose = require('mongoose');

// Define the structure of user documents stored in MongoDB
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Store the user's display name
  email:    { type: String, required: true, unique: true }, // Store the user's email address and prevent duplicate accounts

  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  // Add these two lines to your existing User schema:
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  
  // --- NEW: FORGOT PASSWORD FIELDS ---
  resetCode: { type: String }, // Store the temporary OTP used during password recovery
  resetCodeExpires: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);