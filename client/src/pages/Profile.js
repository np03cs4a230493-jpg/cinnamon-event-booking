import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  
  // State for the user and their bookings
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  
  // State for Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: '', email: '' });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    setUser(storedUser);
    setEditData({ username: storedUser.username, email: storedUser.email });

    // Fetch this specific user's bookings
    axios.get(`http://localhost:5001/api/bookings/user/${storedUser._id}`)
      .then(res => setBookings(res.data))
      .catch(err => console.error("Error fetching bookings:", err));
  }, [navigate]);

  // --- SAVE PROFILE CHANGES ---
const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:5001/api/users/${user._id}`, editData);
      
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage")); 
      
      setUser(response.data);
      setIsEditing(false);
      toast.success("Profile updated successfully!"); // <--- TOAST
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile."); // <--- TOAST
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ color: '#d35400', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>My Profile</h1>
      
      {/* --- USER INFO CARD --- */}
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>👤 Account Details</h2>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} style={editBtnStyle}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '5px' }}>Username</label>
              <input 
                type="text" 
                value={editData.username} 
                onChange={(e) => setEditData({...editData, username: e.target.value})} 
                style={inputStyle} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '5px' }}>Email</label>
              <input 
                type="email" 
                value={editData.email} 
                onChange={(e) => setEditData({...editData, email: e.target.value})} 
                style={inputStyle} 
                required 
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={saveBtnStyle}>💾 Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} style={cancelBtnStyle}>✖ Cancel</button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{ margin: '10px 0', fontSize: '18px' }}><strong>Username:</strong> {user.username}</p>
            <p style={{ margin: '10px 0', fontSize: '18px' }}><strong>Email:</strong> {user.email}</p>
            <p style={{ margin: '10px 0', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
              <strong>Account Type:</strong> 
              <span style={{ marginLeft: '10px', padding: '5px 12px', backgroundColor: user.role === 'admin' ? '#e74c3c' : '#3498db', color: 'white', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>
                {user.role.toUpperCase()}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* --- TICKET HISTORY --- */}
      <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>🎟️ My Tickets ({bookings.length})</h2>
      
      {bookings.length === 0 ? (
        <p style={{ color: '#777', fontStyle: 'italic' }}>You haven't booked any events yet. Time to grab some coffee and enjoy a show!</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {bookings.map(booking => (
            <div key={booking._id} style={{ borderLeft: '5px solid #d35400', backgroundColor: '#fff3e0', padding: '15px', borderRadius: '5px' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#d35400' }}>{booking.event?.title || 'Event no longer available'}</h3>
              <p style={{ margin: '0' }}><strong>Tickets:</strong> {booking.quantity}</p>
              <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>Booking ID: {booking._id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' };
const editBtnStyle = { backgroundColor: 'transparent', border: '1px solid #3498db', color: '#3498db', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const saveBtnStyle = { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { backgroundColor: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

export default Profile;