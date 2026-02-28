const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  // --- NEW: Added Quantity Field ---
  quantity: { 
    type: Number, 
    required: true, 
    default: 1, 
    min: 1 
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'confirmed'
  }
});

module.exports = mongoose.model('Booking', bookingSchema);