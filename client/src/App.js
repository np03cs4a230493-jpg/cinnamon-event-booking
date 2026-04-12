import './App.css';
import React, { useState, useEffect, useRef } from 'react';
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
import Profile from './pages/Profile'; 

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
        <Route path="/profile" element={<Profile />} /> 
      </Routes>
      <Footer />
    </Router>
  );
}

// Navbar Component
function Navbar() {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); 
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsDropdownOpen(false);
    window.dispatchEvent(new Event("storage"));
    navigate('/login');
  };

return (
    <nav style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '15px 40px', backgroundColor: '#2c3e50', color: 'white', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px' 
    }}>
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
        ☕ Cinnamon & Co.
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
      {/* Show Suggest Idea ONLY to logged-in regular users */}
        {(user && user.role !== 'admin') && (
           <Link to="/suggest" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Suggest Idea</Link>
        )}
      {user ? (
          <>
            {/* Show Admin Panel ONLY to admins */}
            {user.role === 'admin' && (
              <Link to="/admin" style={{ color: '#e74c3c', textDecoration: 'none', fontWeight: 'bold' }}>Admin Panel</Link>
            )}
            
            {/* Show My Tickets ONLY to regular users */}
            {user.role !== 'admin' && (
              <Link to="/my-bookings" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>My Tickets</Link>
            )}

            {/* --- DROPDOWN MENU --- */}
            <div style={{ position: 'relative', marginLeft: '10px' }} ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ 
                  background: isDropdownOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: '#f1c40f', fontWeight: 'bold', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', gap: '8px',
                  border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px',
                  transition: 'all 0.2s'
                }}
              >
                Hi, {user.username} <span style={{ fontSize: '0.8rem' }}>{isDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0, 
                  backgroundColor: 'white', borderRadius: '8px', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                  minWidth: '180px', zIndex: 1000, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  border: '1px solid #eee'
                }}>
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    style={{ padding: '12px 20px', color: '#2c3e50', textDecoration: 'none', borderBottom: '1px solid #eee', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    👤 My Profile
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    style={{ padding: '12px 20px', color: '#e74c3c', textDecoration: 'none', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', fontSize: '1rem' }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
            <Link to="/signup" style={{ background: '#d35400', padding: '8px 20px', borderRadius: '20px', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default App;