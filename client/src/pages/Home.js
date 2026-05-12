import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(''); 

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/events');
        
        const smartSortedEvents = response.data.sort((a, b) => {
          const aSoldOut = (a.totalTickets - (a.soldTickets || 0)) <= 0;
          const bSoldOut = (b.totalTickets - (b.soldTickets || 0)) <= 0;

          if (aSoldOut && !bSoldOut) return 1;
          if (!aSoldOut && bSoldOut) return -1;

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

  const uniqueDates = [...new Set(events.map(event => {
    const eventDate = new Date(event.date);
    const yyyy = eventDate.getFullYear();
    const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
    const dd = String(eventDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }))].sort(); 

  const displayedEvents = events.filter(event => {
    if (!filterDate) return true; 
    
    const eventDate = new Date(event.date);
    const yyyy = eventDate.getFullYear();
    const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
    const dd = String(eventDate.getDate()).padStart(2, '0');
    const formattedEventDate = `${yyyy}-${mm}-${dd}`;
    
    return formattedEventDate === filterDate;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#555' }}>Loading events...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#2c3e50', fontSize: '3.5rem', margin: '0 0 10px 0', fontWeight: '800', letterSpacing: '-1px' }}>Cinnamon & Co.</h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d', fontWeight: '500' }}>Discover and book the best coffeehouse events in town.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '50px', backgroundColor: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Date</label>
        
        <select 
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '15px', cursor: 'pointer', backgroundColor: '#f8f9fa', minWidth: '250px', outline: 'none', color: '#2c3e50', fontWeight: '600' }}
        >
          <option value="">🌟 All Upcoming Events</option>
          {uniqueDates.map(date => {
            const displayString = new Date(date).toLocaleDateString(undefined, { 
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
            });
            return <option key={date} value={date}>{displayString}</option>
          })}
        </select>
      </div>

      {displayedEvents.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.2rem', marginTop: '40px', fontWeight: '500' }}>
          No events currently available.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
          {displayedEvents.map(event => { 
            const ticketsLeft = event.totalTickets - (event.soldTickets || 0);

            return (
              <div key={event._id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease' }}
                   onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                   onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <img 
                  src={event.image} 
                  alt={event.title} 
                  style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
                />
                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h2 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.4rem', fontWeight: '700' }}>{event.title}</h2>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', marginBottom: '15px', fontSize: '0.95rem', fontWeight: '500' }}>
                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    <span style={{ fontWeight: '800', color: '#27ae60' }}>
                      {event.price === 0 ? "FREE" : `NPR ${event.price}`}
                    </span>
                  </div>
                  
                  <p style={{ color: '#7f8c8d', fontSize: '0.95rem', flexGrow: 1, marginBottom: '25px', lineHeight: '1.6' }}>
                    {event.description?.length > 100 ? `${event.description.substring(0, 100)}...` : event.description}
                  </p>
                  
                  <Link 
                    to={`/event/${event._id}`} 
                    style={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      width: '100%', 
                      padding: '14px', 
                      backgroundColor: ticketsLeft === 0 ? '#ecf0f1' : '#d35400', 
                      color: ticketsLeft === 0 ? '#95a5a6' : 'white', 
                      textDecoration: 'none', 
                      borderRadius: '8px', 
                      fontWeight: 'bold',
                      pointerEvents: ticketsLeft === 0 ? 'none' : 'auto',
                      boxSizing: 'border-box',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {ticketsLeft === 0 ? "Sold Out" : "View Details & Tickets"}
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