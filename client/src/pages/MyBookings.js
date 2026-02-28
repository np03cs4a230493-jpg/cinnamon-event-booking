import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUser);

    // 2. Fetch bookings for this user
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/bookings/user/${user._id}`);
        setBookings(response.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };

    fetchBookings();
  }, [navigate]);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h2 style={{ color: '#d35400', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>My Tickets</h2>

      {bookings.length === 0 ? (
        <p>You haven't booked any events yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {bookings.map((booking) => (
            // Ticket Card
            <div key={booking._id} style={{ 
              border: '1px solid #ddd', borderRadius: '8px', padding: '20px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                   {booking.event ? booking.event.title : "Event Removed"}
                </h3>
                <p style={{ margin: 0, color: '#777' }}>
                  📅 {booking.event ? new Date(booking.event.date).toLocaleDateString() : "N/A"}
                </p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  Booking ID: {booking._id}
                  <p style={{ fontSize: '14px', color: '#d35400', marginTop: '5px', fontWeight: 'bold' }}>
                  🎟️ Quantity: {booking.quantity || 1} tickets
                </p>
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                 <span style={{ 
                   backgroundColor: '#e8f8f5', color: '#27ae60', padding: '5px 10px', 
                   borderRadius: '15px', fontSize: '14px', fontWeight: 'bold' 
                 }}>
                   {booking.status.toUpperCase()}
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;