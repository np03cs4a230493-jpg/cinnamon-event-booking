import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Import Pages
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import EventDetails from './pages/EventDetails';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin'; 
import Footer from './components/Footer';
import Suggest from './pages/Suggest';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<Admin />} /> 
        <Route path="/suggest" element={<Suggest />} />
      </Routes>
      <Footer />
    </Router>
  );
}

// Navbar Component
function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    navigate('/login');
  };

  return (
    // Uses the new .navbar CSS class
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        ☕ Cinnamon & Co.
      </Link>
      
      <div className="nav-links">
        <Link to="/">Home</Link>
      {(!user || user.role !== 'admin') && (
         <Link to="/suggest" style={{ marginRight: '15px' }}>Suggest Idea</Link>
      )}
        
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ color: '#e74c3c' }}>Admin Panel</Link>
            )}
            <Link to="/my-bookings">My Tickets</Link>
            <span style={{ color: '#f1c40f', marginLeft: '20px', fontWeight: 'bold' }}>
              Hi, {user.username}
            </span>
            <button onClick={handleLogout} className="nav-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup" style={{ background: '#d35400', padding: '8px 15px', borderRadius: '20px', color: 'white' }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default App;