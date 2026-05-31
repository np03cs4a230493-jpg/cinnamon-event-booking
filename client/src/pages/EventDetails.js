import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StripeCheckout from 'react-stripe-checkout'; 
import toast from 'react-hot-toast'; 

function EventDetails() {
  const { id } = useParams();// Retrieve the event ID from the URL
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events`);
        const foundEvent = response.data.find(e => e._id === id);
        setEvent(foundEvent);
      } catch (err) {
        console.error("Error fetching event:", err);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBooking = async (stripeToken) => {// Process ticket booking after successful Stripe payment
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      toast.error("Please Login to book a ticket!"); 
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    const finalQuantity = quantity || 1;

    try {
       await axios.post('/api/bookings', {// Send booking information to the backend
        userId: user._id, 
        eventId: event._id,
        quantity: finalQuantity 
      });

      toast.success(`Payment Successful! Receipt: ${stripeToken.id}`); // Display booking success message
      navigate('/my-bookings'); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking Failed. Please try again."); 
    }
  };

  if (!event) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading details...</div>;

  const ticketsLeft = event.totalTickets - (event.soldTickets || 0);// Calculate remaining tickets available for purchase
  const totalPrice = event.price * (quantity || 1);
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '850px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <img 
        src={event.image} 
        alt={event.title} 
        style={{ width: '100%', height: '450px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
      />
      <h1 style={{ color: '#2c3e50', fontSize: '2.8rem', margin: '30px 0 10px 0', fontWeight: '800', letterSpacing: '-0.5px' }}>{event.title}</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', marginBottom: '25px', borderBottom: '2px solid #ecf0f1', paddingBottom: '25px', fontWeight: '500' }}>
        <span style={{ fontSize: '1.2rem' }}>📅 {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span style={{ fontWeight: '800', fontSize: '1.4rem', color: '#27ae60' }}>
           {event.price === 0 ? "FREE EVENT" : `NPR ${event.price}`}
        </span>
      </div>

      <p style={{ lineHeight: '1.8', fontSize: '1.15rem', color: '#555', marginBottom: '40px' }}>{event.description}</p>
      
      {/* Premium Booking Card */}
      <div style={{ padding: '35px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h3 style={{ borderBottom: '1px solid #ecf0f1', paddingBottom: '15px', marginTop: 0, color: '#2c3e50', fontSize: '1.4rem', fontWeight: '700' }}>Secure Your Spot</h3>
        
        <p style={{ fontWeight: '700', color: ticketsLeft < 10 ? '#e74c3c' : '#27ae60', fontSize: '1.1rem', marginTop: '20px' }}>
          {ticketsLeft === 0 ? "Completely Sold Out!" : `${ticketsLeft} Tickets Remaining`}
        </p>
        
        <div style={{ display: 'flex', gap: '25px', marginTop: '25px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</label>
            <input 
              type="number" 
              min="1" 
              max={ticketsLeft}
              value={quantity}
              disabled={ticketsLeft === 0}
              onChange={(e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val)) setQuantity('');
                else if (val > ticketsLeft) setQuantity(ticketsLeft); 
                else if (val < 1) setQuantity(1); 
                else setQuantity(val);
              }}
              style={{ width: '100px', padding: '14px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '16px', textAlign: 'center', backgroundColor: '#f8f9fa', outline: 'none' }}
            />
          </div>

          {!user ? (
            <div style={{ flex: 1 }}>
              <button 
                onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '16px', fontSize: '16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(44, 62, 80, 0.2)' }}>
                 Login to Book
              </button>
            </div>
          ) : user.role === 'admin' ? (
            <div style={{ flex: 1 }}>
              <button disabled style={{ width: '100%', padding: '16px', fontSize: '16px', backgroundColor: '#ecf0f1', color: '#95a5a6', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold' }}>
                 Admins Cannot Book
              </button>
            </div>
          ) : ticketsLeft === 0 ? (
            <button disabled style={{ flex: 1, padding: '16px', fontSize: '16px', backgroundColor: '#ecf0f1', color: '#95a5a6', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold' }}>
              Sold Out
            </button>
          ) : (
            <div style={{ flex: 1 }}>
              <StripeCheckout  // Open Stripe payment window and process payment
                stripeKey="pk_test_51TGBAZHSmiO8YkaXeL7kxw15MiwDLwiJHyVKTuBY5ReG24wsdvfXSsMlDrVhAD8rMsC5nTGrlLxrEukaMXdI3hde00h0HqZtzq"
                token={handleBooking} 
                name="Cinnamon & Co."
                description={`Tickets for ${event.title}`}
                amount={totalPrice * 100} 
                currency="NPR"
                image="https://cdn-icons-png.flaticon.com/512/924/924514.png" 
              >
                <button style={{ width: '100%', padding: '16px', fontSize: '16px', backgroundColor: '#6772e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(103, 114, 229, 0.3)', transition: 'transform 0.2s ease' }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
                   Pay NPR {totalPrice} Securely
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