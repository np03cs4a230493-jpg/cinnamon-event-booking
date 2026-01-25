const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const User = require('./models/User')

// IMPORT MODELS
// We need this to fetch the Event data we seeded earlier
const Event = require('./models/Event'); 

const app = express();

const Booking = require('./models/Booking');
// CONFIGURATION
// We use 5001 to avoid the "AirPlay Receiver" conflict on Macs
const PORT = process.env.PORT || 5001;

const multer = require('multer');
const path = require('path');
const fs = require('fs'); // To check if folder exists

// MIDDLEWARE
// This "origin" setting fixes the CORS error by explicitly allowing the React app
app.use(cors({
  origin: "http://localhost:3000", // Allow your React Client
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allow these specific actions
  credentials: true
}));

// Allows us to read JSON data sent from the frontend
app.use(express.json());

// DATABASE CONNECTION
// Connects to the 'cinnamon_db' database
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinnamon_db')
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

  // --- FILE UPLOAD CONFIGURATION ---

// 1. Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 2. Tell Multer where to save files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save in 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Create a unique filename (e.g., event-123456789.jpg)
    cb(null, 'event-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 3. Make the 'uploads' folder public so the frontend can see the images
app.use('/uploads', express.static('uploads'));

// --- API ROUTES ---

// 1. Test Route (To check if server is alive)
app.get('/', (req, res) => {
  res.send('Cinnamon & Co. Backend is Running on Port ' + PORT);
});

// 2. GET ALL EVENTS
// The Frontend calls this to display the Event Cards
app.get('/api/events', async (req, res) => {
  try {
    // Fetch all events from MongoDB and sort them by date (ascending)
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2b. ADMIN: CREATE EVENT (WITH IMAGE UPLOAD)
// upload.single('image') expects the frontend to send a file named 'image'
app.post('/api/events', upload.single('image'), async (req, res) => {
  try {
    // If a file was uploaded, use its path. If not, use a default or the text URL.
    const imagePath = req.file ? `http://localhost:5001/uploads/${req.file.filename}` : req.body.image;

    const newEvent = new Event({
      title: req.body.title,
      date: req.body.date,
      price: req.body.price,
      description: req.body.description,
      totalTickets: req.body.totalTickets,
      image: imagePath || 'https://via.placeholder.com/300' // Fallback
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.log("❌ SERVER ERROR:", err); 
    res.status(500).json({ message: "Error creating event", error: err.message });
  }
});

// 2c. ADMIN: DELETE AN EVENT
app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting event" });
  }
});

// 1. REGISTER USER
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, adminKey } = req.body; // <--- Get adminKey from frontend

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // CHECK THE SECRET CODE
    // If they typed "lemonade", make them an admin. Otherwise, 'user'.
    const role = (adminKey === 'lemonade') ? 'admin' : 'user';

    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      role // <--- Save the role
    });
    
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error registering user" });
  }
});

// 4. LOGIN USER
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 2. Check password (Compare typed password with hashed password)
    // bcrypt does the math to see if they match without revealing the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 3. Success!
    res.json({ 
      message: "Login Successful!", 
      username: user.username, 
      email: user.email, 
      _id: user._id,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 5. CREATE A BOOKING
app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    // Create the booking receipt
    const newBooking = new Booking({
      user: userId,
      event: eventId
    });

    await newBooking.save();

    res.status(201).json({ message: "Booking Confirmed!", booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: "Booking Failed", error: err.message });
  }
});

// --- MODELS ---
// (Ensure you have this Booking Schema)
const BookingSchema = new mongoose.Schema({
  userId: String,
  eventId: String,
  date: { type: Date, default: Date.now }
});


// 6. GET USER'S BOOKINGS
app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find bookings for this specific user
    // .populate('event') is the MAGIC TRICK. It fetches the Event details automatically!
    const bookings = await Booking.find({ user: userId }).populate('event');
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
});

// --- NEW ROUTE: ADMIN ANALYTICS ---
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const events = await Event.find();
    const bookings = await Booking.find();

    // Calculate stats for each event
    const analytics = events.map(event => {
      const sold = bookings.filter(b => b.eventId === event._id.toString()).length;
      const revenue = sold * event.price;
      const left = event.totalTickets - sold;
      
      return {
        title: event.title,
        total: event.totalTickets,
        sold: sold,
        left: left,
        revenue: revenue,
        percent: (sold / event.totalTickets) * 100 // For the progress bar
      };
    });

    // Calculate Grand Totals
    const totalRevenue = analytics.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalSold = analytics.reduce((acc, curr) => acc + curr.sold, 0);

    res.json({ eventStats: analytics, grandTotal: { revenue: totalRevenue, sold: totalSold } });
  } catch (err) {
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

// --- MODEL: Suggestions ---
const SuggestionSchema = new mongoose.Schema({
  username: String, // Optional (if logged in)
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const Suggestion = mongoose.model('Suggestion', SuggestionSchema);

// --- ROUTE: Submit Suggestion ---
app.post('/api/suggestions', async (req, res) => {
  try {
    const newSuggestion = new Suggestion({
      username: req.body.username || 'Anonymous',
      title: req.body.title,
      description: req.body.description
    });
    await newSuggestion.save();
    res.status(201).json({ message: "Suggestion received!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving suggestion" });
  }
});

//--- Get All Suggestions (For Admin) ---
app.get('/api/admin/suggestions', async (req, res) => {
  try {
    // Get all suggestions, sorted by newest first (-1)
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching suggestions" });
  }
});


// --- NEW: Acknowledge Suggestion ---
app.patch('/api/suggestions/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await Suggestion.findByIdAndUpdate(req.params.id, { status: status || 'accepted' });
    res.json({ message: "Suggestion status updated" });
  } catch (err) {
    console.log("❌ CRASH ERROR:", err);
    res.status(500).json({ message: "Error updating suggestion" });
  }
});

// --- NEW: Decline Suggestion ---
app.delete('/api/suggestions/:id', async (req, res) => {
  try {
    await Suggestion.findByIdAndDelete(req.params.id);
    res.json({ message: "Suggestion deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting suggestion" });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});