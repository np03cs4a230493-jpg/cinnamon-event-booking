const mongoose = require('mongoose');

// This Schema defines the structure of an "Event" in our database.
// It ensures every event has the specific data we need for the cafe.
const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true // Removes extra spaces from start/end
  },
  description: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  location: { 
    type: String, 
    default: "Cinnamon Garden Cafe" // Default location if not specified
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 // Price cannot be negative
  },
  totalTickets: { 
    type: Number, 
    required: true 
  },
  soldTickets: { 
    type: Number, 
    default: 0 // Starts at 0 sales
  },
  isFeatured: { 
    type: Boolean, 
    default: false // Used for the "Featured Events" section in the proposal
  },
  image: {
    type: String, // This will store the URL of the event image
    default: "https://via.placeholder.com/300" 
  }
}, {
  timestamps: true // Automatically adds 'createdAt' and 'updatedAt' times
});

module.exports = mongoose.model('Event', eventSchema);