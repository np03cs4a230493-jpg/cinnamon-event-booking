import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUser);

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
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h2 style={{ color: '#2c3e50', fontSize: '2.2rem', fontWeight: '800', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '30px' }}>
        My Tickets
      </h2>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem', fontWeight: '500' }}>You haven't booked any events yet. Time to grab some coffee!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {bookings.map((booking) => (
            <div key={booking._id} style={{ 
              borderLeft: '6px solid #d35400', 
              borderRadius: '12px', 
              padding: '25px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: '#fff', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
            }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '700' }}>
                   {booking.event ? booking.event.title : "Event Removed"}
                </h3>
                <p style={{ margin: 0, color: '#7f8c8d', fontWeight: '500', fontSize: '0.95rem' }}>
                  📅 {booking.event ? new Date(booking.event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#d35400', fontWeight: '800', backgroundColor: '#fff3e0', padding: '6px 12px', borderRadius: '8px' }}>
                    🎟️ {booking.quantity || 1} {booking.quantity > 1 ? 'Tickets' : 'Ticket'}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#bdc3c7', fontWeight: '500' }}>
                    ID: {booking._id}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                 <span style={{ 
                   backgroundColor: '#e8f8f5', color: '#27ae60', padding: '8px 16px', 
                   borderRadius: '20px', fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px' 
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