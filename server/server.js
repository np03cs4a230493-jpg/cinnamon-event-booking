const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// IMPORT MODELS
const User = require('./models/User');
const Event = require('./models/Event'); 
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 5001;

// MIDDLEWARE
app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], 
  credentials: true
}));
app.use(express.json());

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinnamon_db')
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- FILE UPLOAD CONFIGURATION ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir); }

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, 'event-' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

// --- API ROUTES ---

// 1. PUBLIC: GET ALL EVENTS
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. ADMIN: CREATE EVENT
app.post('/api/events', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file ? `http://localhost:5001/uploads/${req.file.filename}` : req.body.image;
    const newEvent = new Event({
      title: req.body.title,
      date: req.body.date,
      price: req.body.price,
      description: req.body.description,
      totalTickets: req.body.totalTickets,
      image: imagePath || 'https://via.placeholder.com/300'
    });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) { res.status(500).json({ message: "Error creating event" }); }
});

// 3. ADMIN: DELETE EVENT
app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (err) { res.status(500).json({ message: "Error deleting event" }); }
});

// 4. AUTH: REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, adminKey } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = (adminKey === 'lemonade') ? 'admin' : 'user';

    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) { res.status(500).json({ message: "Error registering user" }); }
});

// 5. AUTH: LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({ message: "Login Successful!", username: user.username, email: user.email, _id: user._id, role: user.role });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// 6. BOOKINGS: CREATE BOOKING & UPDATE INVENTORY
app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, eventId, quantity } = req.body;
    
    // Find the event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check Inventory
    const ticketsSold = event.soldTickets || 0;
    const ticketsLeft = event.totalTickets - ticketsSold;

    if (ticketsLeft <= 0) {
      return res.status(400).json({ message: "Sorry, this event is completely sold out!" });
    }
    if (quantity > ticketsLeft) {
      return res.status(400).json({ message: `We only have ${ticketsLeft} tickets left!` });
    }

    // Save the booking
    const newBooking = new Booking({ user: userId, event: eventId, quantity: quantity });
    await newBooking.save();
    
    // PERMANENTLY UPDATE INVENTORY
    event.soldTickets = ticketsSold + Number(quantity);
    await event.save();
    
    res.status(201).json({ message: "🎉 Booking Confirmed!" });
  } catch (err) { res.status(500).json({ message: "Error processing booking" }); }
});

// 7. BOOKINGS: GET USER BOOKINGS
app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId }).populate('event');
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: "Error fetching bookings" }); }
});

// 8. ADMIN: ANALYTICS
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const events = await Event.find();
    
    const analytics = events.map(event => {
      const sold = event.soldTickets || 0;
      const revenue = sold * event.price;
      const left = event.totalTickets - sold;
      
      return {
        title: event.title, total: event.totalTickets, sold, left, revenue,
        percent: event.totalTickets > 0 ? (sold / event.totalTickets) * 100 : 0
      };
    });

    const totalRevenue = analytics.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalSold = analytics.reduce((acc, curr) => acc + curr.sold, 0);

    res.json({ eventStats: analytics, grandTotal: { revenue: totalRevenue, sold: totalSold } });
  } catch (err) { res.status(500).json({ message: "Error fetching analytics" }); }
});

// --- SUGGESTIONS ---
const SuggestionSchema = new mongoose.Schema({
  username: String, title: { type: String, required: true }, description: { type: String, required: true },
  status: { type: String, default: 'pending' }, createdAt: { type: Date, default: Date.now }
});
const Suggestion = mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);

app.post('/api/suggestions', async (req, res) => {
  try {
    await new Suggestion({ ...req.body, username: req.body.username || 'Anonymous' }).save();
    res.status(201).json({ message: "Suggestion received!" });
  } catch (err) { res.status(500).json({ message: "Error saving suggestion" }); }
});

app.get('/api/admin/suggestions', async (req, res) => {
  try { res.json(await Suggestion.find().sort({ createdAt: -1 })); } 
  catch (err) { res.status(500).json({ message: "Error fetching suggestions" }); }
});

app.patch('/api/suggestions/:id', async (req, res) => {
  try {
    await Suggestion.findByIdAndUpdate(req.params.id, { status: req.body.status || 'accepted' });
    res.json({ message: "Suggestion status updated" });
  } catch (err) { res.status(500).json({ message: "Error updating suggestion" }); }
});

app.delete('/api/suggestions/:id', async (req, res) => {
  try {
    await Suggestion.findByIdAndDelete(req.params.id);
    res.json({ message: "Suggestion deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting suggestion" }); }
});

// START SERVER
app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));