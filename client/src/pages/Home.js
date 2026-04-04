import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/events');
        
        // --- NEW: SMART FRONTEND SORTING ---
        const smartSortedEvents = response.data.sort((a, b) => {
          const aSoldOut = (a.totalTickets - (a.soldTickets || 0)) <= 0;
          const bSoldOut = (b.totalTickets - (b.soldTickets || 0)) <= 0;

          // 1. Push Sold Out events to the very bottom
          if (aSoldOut && !bSoldOut) return 1;
          if (!aSoldOut && bSoldOut) return -1;

          // 2. Otherwise, sort by most tickets sold
          return (b.soldTickets || 0) - (a.soldTickets || 0);
        });

        setEvents(smartSortedEvents);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching events:", err);
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#555' }}>Loading events...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#d35400', fontSize: '3rem', margin: '0 0 10px 0' }}>Welcome to Cinnamon & Co.</h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>Discover and book the best coffeehouse events in town!</p>
      </div>

      {events.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#777', fontSize: '1.1rem' }}>No events currently available. Check back soon!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {events.map(event => {
            // Calculate remaining tickets
            const ticketsLeft = event.totalTickets - (event.soldTickets || 0);

            return (
              <div key={event._id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <img 
                  src={event.image} 
                  alt={event.title} 
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
                />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.5rem' }}>{event.title}</h2>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', marginBottom: '15px', fontSize: '0.95rem' }}>
                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                      {event.price === 0 ? "FREE" : `NPR ${event.price}`}
                    </span>
                  </div>
                  
                  <p style={{ color: '#555', fontSize: '0.95rem', flexGrow: 1, marginBottom: '20px', lineHeight: '1.5' }}>
                    {event.description?.length > 100 ? `${event.description.substring(0, 100)}...` : event.description}
                  </p>
                  
                  {/* --- NEW FIX: Link to details page instead of direct booking --- */}
                  <Link 
                    to={`/event/${event._id}`} 
                    style={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      width: '100%', 
                      padding: '12px', 
                      backgroundColor: ticketsLeft === 0 ? '#bdc3c7' : '#d35400', 
                      color: 'white', 
                      textDecoration: 'none', 
                      borderRadius: '6px', 
                      fontWeight: 'bold',
                      pointerEvents: ticketsLeft === 0 ? 'none' : 'auto', // Disables clicking if sold out
                      boxSizing: 'border-box'
                    }}
                  >
                    {ticketsLeft === 0 ? "Sold Out" : "View Details & Tickets 🎟️"}
                  </Link>

                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

export default Home;