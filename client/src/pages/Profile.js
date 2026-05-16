import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  // --- NEW: State to hold their suggestions ---
  const [mySuggestions, setMySuggestions] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    setUser(storedUser);
    setEditData({ username: storedUser.username, email: storedUser.email, password: '' });

    // Fetch this specific user's bookings
    axios.get(`http://localhost:5001/api/bookings/user/${storedUser._id}`)
      .then(res => setBookings(res.data))
      .catch(err => console.error("Error fetching bookings:", err));

    // --- NEW: Fetch this specific user's suggestions ---
    axios.get(`http://localhost:5001/api/suggestions/user/${storedUser.email}`)
      .then(res => setMySuggestions(res.data))
      .catch(err => console.error("Error fetching suggestions:", err));

  }, [navigate]);

const handleSave = async (e) => {
    e.preventDefault();
    
    // 1. Strict Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editData.email)) {
      toast.error("Please enter a valid email address."); 
      return; 
    }

    // --- NEW: 2. Strict Password Validation (Only if they typed a new one!) ---
    if (editData.password && editData.password.trim() !== '') {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(editData.password)) {
        toast.error("Password must be at least 8 characters long and include a letter and a number."); 
        return; 
      }
    }

    try {
      const response = await axios.put(`http://localhost:5001/api/users/${user._id}`, editData);
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage")); 
      setUser(response.data);
      setIsEditing(false);
      setEditData({ ...editData, password: '' });
      toast.success("Profile updated successfully!"); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile."); 
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h1 style={{ color: '#2c3e50', fontSize: '2.5rem', fontWeight: '800', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '30px' }}>
        My Profile
      </h1>
      
      {/* USER INFO CARD */}
      <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '16px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem', fontWeight: '700' }}>👤 Account Details</h2>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} style={editBtnStyle}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input type="text" value={editData.username} onChange={(e) => setEditData({...editData, username: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>New Password <span style={{color: '#bdc3c7', textTransform: 'none', fontWeight: '500'}}>(Leave blank to keep current)</span></label>
              <input type="password" placeholder="••••••••" value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button type="submit" style={saveBtnStyle}>💾 Save Changes</button>
              <button type="button" onClick={() => { setIsEditing(false); setEditData({ username: user.username, email: user.email, password: '' }); }} style={cancelBtnStyle}>✖ Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#555' }}><strong style={{ color: '#2c3e50' }}>Username:</strong> {user.username}</p>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#555' }}><strong style={{ color: '#2c3e50' }}>Email:</strong> {user.email}</p>
            <p style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              <strong style={{ color: '#2c3e50' }}>Account Type:</strong> 
              <span style={{ marginLeft: '12px', padding: '6px 14px', backgroundColor: user.role === 'admin' ? '#e74c3c' : '#3498db', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>
                {user.role.toUpperCase()}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* TICKET HISTORY */}
      <h2 style={{ color: '#2c3e50', fontSize: '1.8rem', fontWeight: '800', marginBottom: '25px' }}>🎟️ My Tickets ({bookings.length})</h2>
      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>You haven't booked any events yet. Time to grab some coffee and enjoy a show!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {bookings.map(booking => (
            <div key={booking._id} style={{ borderLeft: '6px solid #d35400', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '700' }}>{booking.event?.title || 'Event no longer available'}</h3>
              <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '1.1rem' }}><strong style={{ color: '#2c3e50' }}>Tickets:</strong> {booking.quantity}</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#95a5a6', fontWeight: '500' }}>Booking ID: {booking._id}</p>
            </div>
          ))}
        </div>
      )}

      {/* --- NEW: MY EVENT IDEAS SECTION --- */}
      <h2 style={{ color: '#2c3e50', fontSize: '1.8rem', fontWeight: '800', marginTop: '50px', marginBottom: '25px' }}>💡 My Event Ideas ({mySuggestions.length})</h2>
      {mySuggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>You haven't submitted any ideas yet. Have a cool event in mind?</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {mySuggestions.map(sugg => {
            // Dynamic styling based on Admin's decision
            let statusColor = '#f1c40f'; // Yellow for Pending
            let statusText = 'PENDING REVIEW';
            let bgColor = '#fcf9e8';
            
            if (sugg.status === 'accepted') {
              statusColor = '#27ae60'; // Green
              statusText = 'ACCEPTED! 🎉';
              bgColor = '#e8f8f5';
            } else if (sugg.status === 'declined') {
              statusColor = '#e74c3c'; // Red
              statusText = 'NOT RIGHT NOW';
              bgColor = '#fdedec';
            }

            return (
              <div key={sugg._id} style={{ borderLeft: `6px solid ${statusColor}`, backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: '0', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '700' }}>{sugg.title}</h3>
                  <span style={{ backgroundColor: bgColor, color: statusColor, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>
                    {statusText}
                  </span>
                </div>
                <p style={{ margin: '0', color: '#555', fontSize: '1rem', lineHeight: '1.5' }}>"{sugg.description}"</p>
              </div>
            )
          })}
        </div>
      )}

    </div>
  );
};

// --- STYLES ---
const labelStyle = { display: 'block', fontSize: '13px', color: '#7f8c8d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease', outline: 'none', boxSizing: 'border-box' };
const editBtnStyle = { backgroundColor: '#f8f9fa', border: '1px solid #e0e6ed', color: '#2c3e50', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s ease' };
const saveBtnStyle = { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', transition: 'background-color 0.2s ease', boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)' };
const cancelBtnStyle = { backgroundColor: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', transition: 'all 0.2s ease' };

export default Profile;