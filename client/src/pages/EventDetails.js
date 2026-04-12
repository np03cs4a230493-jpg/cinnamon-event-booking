import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StripeCheckout from 'react-stripe-checkout'; // <--- NEW IMPORT

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);

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

  // --- UPDATED: Now receives a "token" from Stripe when the popup succeeds ---
  const handleBooking = async (stripeToken) => {
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      alert("Please Login to book a ticket!");
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    const finalQuantity = quantity || 1;

    try {
      // We process the booking in our database normally
      const res = await axios.post('http://localhost:5001/api/bookings', {
        userId: user._id, 
        eventId: event._id,
        quantity: finalQuantity 
      });

      // Show a fancy alert with the Stripe Receipt ID to make it look super legit!
      alert(`✅ Payment Successful!\nStripe Receipt: ${stripeToken.id}\n\n${res.data.message}`);
      navigate('/my-bookings'); 
    } catch (err) {
      alert(err.response?.data?.message || "Booking Failed. Please try again.");
    }
  };

  if (!event) return <div style={{ padding: '20px' }}>Loading details...</div>;

  const ticketsLeft = event.totalTickets - (event.soldTickets || 0);
  const totalPrice = event.price * (quantity || 1);

  // --- NEW: Grab the logged-in user to check their role ---
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
// ... rest of the code
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <img 
        src={event.image} 
        alt={event.title} 
        style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} 
      />
      <h1 style={{ color: '#d35400', fontSize: '2.5rem', margin: '20px 0 10px 0' }}>{event.title}</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <span style={{ fontSize: '1.1rem' }}>📅 {new Date(event.date).toLocaleDateString()}</span>
        <span style={{ fontWeight: 'bold', fontSize: '1.3rem', color: '#27ae60' }}>
           {event.price === 0 ? "FREE" : `NPR ${event.price}`}
        </span>
      </div>

      <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#444' }}>{event.description}</p>
      
      <div style={{ marginTop: '40px', padding: '25px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
        <h3 style={{ borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', marginTop: 0, color: '#2c3e50' }}>Ticket Information</h3>
        
        <p style={{ fontWeight: 'bold', color: ticketsLeft < 10 ? '#e74c3c' : '#27ae60', fontSize: '1.1rem' }}>
          {ticketsLeft === 0 ? "Completely Sold Out!" : `Tickets Available: ${ticketsLeft} / ${event.totalTickets}`}
        </p>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '25px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>Quantity</label>
            <input 
              type="number" 
              min="1" 
              max={ticketsLeft}
              value={quantity}
              disabled={ticketsLeft === 0}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setQuantity(isNaN(val) ? '' : val);
              }}
              style={{ width: '90px', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', textAlign: 'center' }}
            />
          </div>

          {/* --- NEW: STRIPE CHECKOUT BUTTON --- */}
        {/* --- SMART BUTTON LOGIC --- */}
          {!user ? (
            <div style={{ flex: 1, marginTop: '22px' }}>
              <button 
                onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '15px', fontSize: '18px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                🔒 Login to Book Tickets
              </button>
            </div>
          ) : user.role === 'admin' ? (
            <div style={{ flex: 1, marginTop: '22px' }}>
              <button disabled style={{ width: '100%', padding: '15px', fontSize: '18px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: 'bold' }}>
                🚫 Admins Cannot Book
              </button>
            </div>
          ) : ticketsLeft === 0 ? (
            <button disabled style={{ flex: 1, padding: '15px', fontSize: '18px', marginTop: '22px', backgroundColor: '#bdc3c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: 'bold' }}>
              Sold Out
            </button>
          ) : (
            <div style={{ flex: 1, marginTop: '22px' }}>
              <StripeCheckout
                stripeKey="pk_test_51TGBAZHSmiO8YkaXeL7kxw15MiwDLwiJHyVKTuBY5ReG24wsdvfXSsMlDrVhAD8rMsC5nTGrlLxrEukaMXdI3hde00h0HqZtzq"
                token={handleBooking} 
                name="Cinnamon & Co."
                description={`Tickets for ${event.title}`}
                amount={totalPrice * 100} 
                currency="NPR"
                image="https://cdn-icons-png.flaticon.com/512/924/924514.png" 
              >
                <button style={{ width: '100%', padding: '15px', fontSize: '18px', backgroundColor: '#6772e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(103, 114, 229, 0.2)', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
                  💳 Pay NPR {totalPrice} securely
                </button>
              </StripeCheckout>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetails;