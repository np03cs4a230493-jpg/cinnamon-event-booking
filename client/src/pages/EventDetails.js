import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  
  const [quantity, setQuantity] = useState(1);

  // 1. Fetch Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/events`);
        const foundEvent = response.data.find(e => e._id === id);
        setEvent(foundEvent);
      } catch (err) {
        console.error("Error fetching event:", err);
      }
    };
    fetchEvent();
  }, [id]);

  // 2. THE BOOKING LOGIC
  const handleBooking = async () => {
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      alert("Please Login to book a ticket!");
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    
    // Fallback to 1 if the user somehow left the box completely empty
    const finalQuantity = quantity || 1;

    try {
      const res = await axios.post('http://localhost:5001/api/bookings', {
        userId: user._id, 
        eventId: event._id,
        quantity: finalQuantity 
      });

      alert(res.data.message);
      navigate('/my-bookings'); 
    } catch (err) {
      alert(err.response?.data?.message || "Booking Failed. Please try again.");
    }
  };

  if (!event) return <div style={{ padding: '20px' }}>Loading details...</div>;

  // Calculate exactly how many tickets are left
  const ticketsLeft = event.totalTickets - (event.soldTickets || 0);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <img 
        src={event.image} 
        alt={event.title} 
        style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '10px' }} 
      />
      <h1 style={{ color: '#d35400', fontSize: '2.5rem', marginBottom: '10px' }}>{event.title}</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', marginBottom: '20px' }}>
        <span>📅 {new Date(event.date).toLocaleDateString()}</span>
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#27ae60' }}>
           {event.price === 0 ? "FREE" : `NPR ${event.price}`}
        </span>
      </div>

      <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#333' }}>{event.description}</p>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px' }}>
        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Ticket Information</h3>
        
        {/* NEW: Displays dynamic Tickets Left */}
        <p style={{ fontWeight: 'bold', color: ticketsLeft < 10 ? '#e74c3c' : '#333' }}>
          Tickets Left: {ticketsLeft} / {event.totalTickets}
        </p>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Quantity</label>
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => {
                // This fix stops the "013" bug by forcing it to act as a pure integer
                const val = parseInt(e.target.value, 10);
                setQuantity(isNaN(val) ? '' : val);
              }}
              style={{ width: '80px', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
            />
          </div>

          <button 
            onClick={handleBooking}
            // Disable the button if the event is sold out!
            disabled={ticketsLeft === 0} 
            style={{ 
              flex: 1, padding: '12px 30px', fontSize: '18px', marginTop: '16px',
              backgroundColor: ticketsLeft === 0 ? '#bdc3c7' : '#d35400', 
              color: 'white', border: 'none', borderRadius: '5px', 
              cursor: ticketsLeft === 0 ? 'not-allowed' : 'pointer' 
            }}>
            {ticketsLeft === 0 ? "Sold Out" : `Confirm Booking - NPR ${event.price * (quantity || 1)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;