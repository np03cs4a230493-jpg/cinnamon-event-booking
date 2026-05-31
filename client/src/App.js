import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast'; // Updated to include toast

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
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Toaster position="top-center" reverseOrder={false} />
        
        <Navbar />
        
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<Admin />} /> 
            <Route path="/suggest" element={<Suggest />} />
            <Route path="/profile" element={<Profile />} /> 
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

// Navbar Component
function Navbar() {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // Added for logout pop-up state
  const dropdownRef = useRef(null); 
  const navigate = useNavigate();

  // Check if a user is already logged in
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Executed only after they click "Yes, Logout" in the modal popup box
  const handleLogoutConfirm = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsDropdownOpen(false);
    setIsLogoutModalOpen(false); // Close modal
    window.dispatchEvent(new Event("storage"));
    toast.success("Logged out successfully! See you soon. ☕"); 
    navigate('/login');
  };

  return (
    <>
      {/* 🆕 CUSTOM LOGOUT CONFIRMATION MODAL POPUP */}
      {isLogoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '70px', height: '70px', border: '3px solid #f8bb86', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px auto' }}>
              <span style={{ color: '#f8bb86', fontSize: '40px', fontWeight: '300' }}>?</span>
            </div>
            <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '24px', fontWeight: '700' }}>Logging Out?</h2>
            <p style={{ color: '#7f8c8d', margin: '0 0 30px 0', fontSize: '15px' }}>Are you sure you want to end your current session?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button 
                onClick={() => setIsLogoutModalOpen(false)} 
                style={{ padding: '12px 20px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogoutConfirm} 
                style={{ padding: '12px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)' }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '15px 40px', backgroundColor: '#2c3e50', color: 'white', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px' 
      }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          ☕ Cinnamon & Co.
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
          
          {(user && user.role !== 'admin') && (
             <Link to="/suggest" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Suggest Idea</Link>
          )}

          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" style={{ color: '#e74c3c', textDecoration: 'none', fontWeight: 'bold' }}>Admin Panel</Link>
              )}
              
              {user.role !== 'admin' && (
                <Link to="/my-bookings" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>My Tickets</Link>
              )}

              <div style={{ position: 'relative', marginLeft: '10px' }} ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ 
                    background: isDropdownOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: '#f1c40f', fontWeight: 'bold', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px',
                    transition: 'all 0.2s ease', fontFamily: 'inherit', fontSize: '14px'
                  }}
                >
                  Hi, {user.username} <span style={{ fontSize: '10px' }}>{isDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '130%', right: 0, 
                    backgroundColor: '#ffffff', borderRadius: '12px', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
                    minWidth: '200px', zIndex: 1000, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    border: '1px solid #f1f2f6',
                    padding: '8px 0'
                  }}>
                    <Link 
                      to="/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      style={{ ...dropdownItemStyle, color: '#2c3e50' }}
                    >
                      My Profile
                    </Link>
                    
                    <div style={{ height: '1px', backgroundColor: '#f1f2f6', margin: '4px 0' }}></div>
                    
                    {/* Intercept log out trigger action to fire custom modal toggle container hook instead */}
                    <button 
                      onClick={() => setIsLogoutModalOpen(true)} 
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fcf3f2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ ...dropdownItemStyle, color: '#e74c3c' }}
                    >
                      Logout
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
    </>
  );
}

const dropdownItemStyle = {
  padding: '12px 20px', 
  textDecoration: 'none', 
  background: 'transparent', 
  border: 'none', 
  textAlign: 'left', 
  cursor: 'pointer', 
  fontWeight: '600', 
  display: 'block', 
  boxSizing: 'border-box',
  width: '100%', 
  margin: 0,
  fontFamily: 'inherit',  
  fontSize: '15px', 
  lineHeight: '1.5',      
  transition: 'background 0.2s ease'
};

export default App;