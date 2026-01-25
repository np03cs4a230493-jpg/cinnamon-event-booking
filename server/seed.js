const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');

// Load environment variables
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinnamon_db')
  .then(() => console.log("Connected to DB for Seeding..."))
  .catch(err => console.log(err));

// Sample Data
const sampleEvents = [
  {
    title: "Acoustic Friday Night",
    description: "Enjoy live acoustic music with our special cinnamon coffee.",
    date: new Date("2025-12-20"),
    price: 500, // 500 NPR
    totalTickets: 50,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1515169067750-d51a73b50981?w=500"
  },
  {
    title: "Latte Art Workshop",
    description: "Learn how to make beautiful latte art from our head barista.",
    date: new Date("2025-12-22"),
    price: 1500, // 1500 NPR
    totalTickets: 10,
    isFeatured: false,
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500"
  },
  {
    title: "Open Mic Night",
    description: "Showcase your talent! Poetry, music, and storytelling.",
    date: new Date("2025-12-25"),
    price: 0, // Free Event
    totalTickets: 100,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1445985543470-4102ba9c43cd?w=500"
  }
];

// Insert Data
const seedDB = async () => {
  await Event.deleteMany({}); // Clear old data
  await Event.insertMany(sampleEvents); // Insert new data
  console.log("✅ Database Seeded with 3 Events!");
  mongoose.connection.close();
};

seedDB();