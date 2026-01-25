const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // This links the booking to a specific User
    required: true 
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', // This links the booking to a specific Event
    required: true 
  },
  bookingDate: {
    type: Date,
    default: Date.now // Automatically sets the time of booking
  },
  status: {
    type: String,
    default: 'confirmed'
  }
});

module.exports = mongoose.model('Booking', bookingSchema);