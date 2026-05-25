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
    user: 'cinnamoncotickets@gmail.com',
    pass: 'euygaddmlozxpjzj'
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client("936864795704-0b0qod9dau9912l81prptrstcdllmlgf.apps.googleusercontent.com");

// CORS & BODY PARSERS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    const events = await Event.find().sort({ soldTickets: -1, date: 1 });
    res.json(events);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/events', upload.single('image'), async (req, res) => {
  try {
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const imagePath = req.file ? `${baseUrl}/uploads/${req.file.filename}` : req.body.image;
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
    const { username, email, password, adminCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = adminCode === 'Lemonade' ? 'admin' : 'user'; 
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`\n☕ [DEVELOPER TESTING] New Signup OTP for ${email} is: ${verificationCode}\n`);
    
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role,
      isVerified: false,
      verificationCode 
    });
    await newUser.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your Cinnamon & Co. Account',
      html: `
        <h2>Welcome to Cinnamon & Co.! ☕</h2>
        <p>Your account has been created. Please use the 6-digit code below to verify your email address:</p>
        <h1 style="font-size: 40px; letter-spacing: 5px; color: #d35400;">${verificationCode}</h1>
        <p>If you did not request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: "Verification code sent to email!" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post('/api/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isVerified) return res.status(400).json({ message: "Email is already verified." });
    if (user.verificationCode !== code) return res.status(400).json({ message: "Invalid verification code." });

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ 
      message: "Email verified successfully!",
      user: { _id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during verification." });
  }
});

// ✅ UNIFIED CLEAN LOGIN ROUTE WITH VERIFICATION CHECK
app.post('/api/login', async (req, res) => {
  try {
    const loginString = req.body.identifier || req.body.email;
    const password = req.body.password;
    
    const user = await User.findOne({ 
      $or: [
        { email: loginString }, 
        { username: loginString }
      ] 
    });
    
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email address first!", email: user.email });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({ _id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (err) { 
    res.status(500).json({ message: "Server error" }); 
  }
});

// ✅ FIXED GOOGLE LOGIN WITH AUTOMATIC ISVERIFIED ASSIGNMENT
app.post('/api/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: "936864795704-0b0qod9dau9912l81prptrstcdllmlgf.apps.googleusercontent.com"
    });
    
    const { name, email } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      user = new User({
        username: name,
        email: email,
        password: randomPassword,
        role: 'user',
        isVerified: true
      });
      await user.save();
    }

    res.json({ message: "Google Login Successful!", username: user.username, email: user.email, _id: user._id, role: user.role });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Google login failed" });
  }
});

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
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'cinnamoncotickets@gmail.com',
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
        _id: event._id,
        title: event.title, total: event.totalTickets, sold, left, revenue,
        percent: event.totalTickets > 0 ? (sold / event.totalTickets) * 100 : 0
      };
    });

    const totalRevenue = analytics.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalSold = analytics.reduce((acc, curr) => acc + curr.sold, 0);

    res.json({ eventStats: analytics, grandTotal: { revenue: totalRevenue, sold: totalSold } });
  } catch (err) { res.status(500).json({ message: "Error fetching analytics" }); }
});

app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email') 
      .populate('event', 'title date')
      .sort({ bookingDate: -1 });
      
    res.json(bookings);
  } catch (err) { 
    res.status(500).json({ message: "Error fetching bookings" }); 
  }
});

const SuggestionSchema = new mongoose.Schema({
  username: String, 
  email: String,
  title: { type: String, required: true }, 
  description: { type: String, required: true },
  status: { type: String, default: 'pending' }, 
  createdAt: { type: Date, default: Date.now }
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
    const updatedSuggestion = await Suggestion.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status || 'accepted' }, 
      { new: true } 
    );
    
    if (updatedSuggestion.email && req.body.status === 'accepted') {
      const mailOptions = {
        from: 'cinnamoncotickets@gmail.com',
        to: updatedSuggestion.email,
        subject: `🎉 Your Event Idea was Accepted!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #d35400;">Great news, ${updatedSuggestion.username}!</h2>
            <p style="font-size: 16px; color: #555;">We absolutely loved your idea for <strong>"${updatedSuggestion.title}"</strong> and we are making it happen!</p>
            <p style="font-size: 16px; color: #555;">Keep an eye on the Cinnamon & Co. homepage for official dates and tickets.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #777;">Thanks for being an awesome part of our community!<br/>- The Cinnamon & Co. Team</p>
          </div>
        `
      };
      transporter.sendMail(mailOptions).catch(err => console.log("❌ Suggestion Email Error:", err));
    }

    res.json({ message: "Suggestion status updated" });
  } catch (err) { 
    res.status(500).json({ message: "Error updating suggestion" }); 
  }
});

app.delete('/api/suggestions/:id', async (req, res) => {
  try {
    await Suggestion.findByIdAndDelete(req.params.id);
    res.json({ message: "Suggestion deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting suggestion" }); }
});

app.put('/api/events/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
      updateData.image = `${baseUrl}/uploads/${req.file.filename}`;
    }
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedEvent);
  } catch (err) { 
    res.status(500).json({ message: "Error updating event" }); 
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const emailChanged = email !== user.email;

    if (emailChanged) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: "That email is already in use by another account." });
      }
      user.isVerified = false;
      user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your new email for Cinnamon & Co.',
        html: `
          <h2>Cinnamon & Co. Security ☕</h2>
          <p>You recently changed your email address. Please use the 6-digit code below to verify it:</p>
          <h1 style="font-size: 40px; letter-spacing: 5px; color: #d35400;">${user.verificationCode}</h1>
          <p>If you did not make this change, please contact support immediately.</p>
        `
      };
      await transporter.sendMail(mailOptions);
    }

    user.username = username;
    user.email = email;

    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ 
      message: emailChanged ? "Please verify your new email." : "Profile updated successfully!", 
      username: user.username, 
      email: user.email, 
      _id: user._id, 
      role: user.role,
      emailChanged
    });
  } catch (err) {
    console.error("🚨 PROFILE UPDATE ERROR:", err); 
    res.status(500).json({ message: "Server error while updating profile." });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account with that email found." });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n🚨 DEVELOPER CHEAT CODE: The OTP for ${email} is: ${resetCode}\n`);
    
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    const mailOptions = {
      from: 'cinnamoncotickets@gmail.com',
      to: user.email,
      subject: `🔒 Password Reset Code: ${resetCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d35400;">Password Reset Request</h2>
          <p>We received a request to reset your Cinnamon & Co. password.</p>
          <p>Your 6-digit reset code is: <strong style="font-size: 24px; color: #2c3e50; letter-spacing: 2px;">${resetCode}</strong></p>
          <p style="color: #e74c3c; font-size: 12px;">This code will expire in 15 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions).catch(err => console.log("Email error:", err));
    res.json({ message: "Reset code sent to your email!" });
  } catch (err) {
    res.status(500).json({ message: "Error sending reset code." });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ 
      email, 
      resetCode: code, 
      resetCodeExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset code." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ message: "Password has been successfully reset!" });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password." });
  }
});

app.get('/api/suggestions/user/:email', async (req, res) => {
  try {
    const userSuggestions = await Suggestion.find({ email: req.params.email });
    res.json(userSuggestions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user suggestions" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));