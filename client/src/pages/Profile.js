import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();
  
  // Get user info from local storage (saved during login)
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login'); // Kick them out if not logged in
      return;
    }

    // Fetch this specific user's bookings
    fetch(`http://localhost:5001/api/bookings/user/${user._id}`)
      .then(res => res.json())
      .then(data => setBookings(data))
      .catch(err => console.error("Error fetching bookings:", err));
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ color: '#d35400', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>My Profile</h1>
      
      {/* --- USER INFO CARD --- */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>👤 Account Details</h2>
        <p style={{ margin: '8px 0', fontSize: '18px' }}><strong>Username:</strong> {user.username}</p>
        <p style={{ margin: '8px 0', fontSize: '18px' }}><strong>Email:</strong> {user.email}</p>
        <p style={{ margin: '8px 0', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
          <strong>Account Type:</strong> 
          <span style={{ marginLeft: '10px', padding: '5px 12px', backgroundColor: user.role === 'admin' ? '#e74c3c' : '#3498db', color: 'white', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>
            {user.role.toUpperCase()}
          </span>
        </p>
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

export default Profile;