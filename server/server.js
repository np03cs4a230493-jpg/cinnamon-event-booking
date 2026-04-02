const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); 

// IMPORT MODELS
const User = require('./models/User');
const Event = require('./models/Event'); 
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 5001;

// --- EMAIL SETUP (THE TRANSPORTER) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'cinnamoncotickets@gmail.com',         // <--- PUT YOUR GMAIL HERE
    pass: 'gijfqizmrklmozll'   // <--- PUT YOUR GOOGLE APP PASSWORD HERE (no spaces)
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client("936864795704-0b0qod9dau9912l81prptrstcdllmlgf.apps.googleusercontent.com"); // <-- We will paste it here later!

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

app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/events', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file ? `http://localhost:5001/uploads/${req.file.filename}` : req.body.image;
    const newEvent = new Event({ ...req.body, image: imagePath || 'https://via.placeholder.com/300' });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) { res.status(500).json({ message: "Error creating event" }); }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (err) { res.status(500).json({ message: "Error deleting event" }); }
});

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

app.post('/api/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    
    // 1. Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: "936864795704-0b0qod9dau9912l81prptrstcdllmlgf.apps.googleusercontent.com" // <-- And paste it here later!
    });
    
    const { name, email } = ticket.getPayload();

    // 2. Check if user already exists in our database
    let user = await User.findOne({ email });

    // 3. If they don't exist, create a new account for them automatically!
    if (!user) {
      // Generate a random password since our DB requires one
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      user = new User({
        username: name,
        email: email,
        password: randomPassword,
        role: 'user'
      });
      await user.save();
    }

    // 4. Send back the user data just like a normal login
    res.json({ message: "Google Login Successful!", username: user.username, email: user.email, _id: user._id, role: user.role });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Google login failed" });
  }
});

// BOOKINGS: CREATE BOOKING & SEND EMAIL
app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, eventId, quantity } = req.body;
    
    const event = await Event.findById(eventId);
    const user = await User.findById(userId);
    
    if (!event || !user) return res.status(404).json({ message: "Data not found" });

    const ticketsSold = event.soldTickets || 0;
    const ticketsLeft = event.totalTickets - ticketsSold;

    if (ticketsLeft <= 0) return res.status(400).json({ message: "Sorry, this event is completely sold out!" });
    if (quantity > ticketsLeft) return res.status(400).json({ message: `We only have ${ticketsLeft} tickets left!` });

    const newBooking = new Booking({ user: userId, event: eventId, quantity: quantity });
    await newBooking.save();
    
    event.soldTickets = ticketsSold + Number(quantity);
    await event.save();
    
    // --- SEND THE EMAIL RECEIPT ---
    const mailOptions = {
      from: 'YOUR_EMAIL@gmail.com', // <--- Must match your Gmail above
      to: user.email,
      subject: `🎟️ Tickets Confirmed: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2c3e50;">Hi ${user.username},</h2>
          <p style="font-size: 16px; color: #555;">Thank you for your booking! Here are your ticket details for your upcoming event at Cinnamon & Co.</p>
          
          <div style="background-color: #fff3e0; padding: 20px; border-left: 5px solid #d35400; border-radius: 5px; margin-top: 20px;">
            <h3 style="color: #d35400; margin-top: 0;">${event.title}</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity} tickets</p>
            <p style="margin: 5px 0;"><strong>Total Paid:</strong> NPR ${event.price * quantity}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #888;"><strong>Booking ID:</strong> ${newBooking._id}</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #777;">We look forward to seeing you!<br/>- The Cinnamon & Co. Team</p>
        </div>
      `
    };

    // Force the server to tell us what happens with the email!
    console.log(`⏳ Attempting to send email to: ${user.email}...`);
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent perfectly: " + info.response);
    } catch (emailError) {
      console.log("❌ Email Error: ", emailError);
    }

    res.status(201).json({ message: "🎉 Booking Confirmed! A receipt has been sent to your email." });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: "Error processing booking" }); 
  }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId }).populate('event');
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: "Error fetching bookings" }); }
});

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

app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));
