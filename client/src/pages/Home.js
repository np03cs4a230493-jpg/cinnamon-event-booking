import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FOR FILTERS ---
  const [filterDate, setFilterDate] = useState(''); 
  const [searchQuery, setSearchQuery] = useState(''); // <--- NEW: Search state

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

  // --- UPGRADED FILTER LOGIC ---
  const displayedEvents = events.filter(event => {
    // 1. Check Date Filter
    let matchesDate = true;
    if (filterDate) {
      const eventDate = new Date(event.date);
      const yyyy = eventDate.getFullYear();
      const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
      const dd = String(eventDate.getDate()).padStart(2, '0');
      matchesDate = `${yyyy}-${mm}-${dd}` === filterDate;
    }

    // 2. Check Text Search Filter (Matches title or description)
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(query);
      const descMatch = event.description?.toLowerCase().includes(query);
      matchesSearch = titleMatch || descMatch;
    }
    
    // Must pass both filters to show up!
    return matchesDate && matchesSearch;
  });

  const featuredEvents = displayedEvents.filter(e => e.isFeatured);
  const regularEvents = displayedEvents.filter(e => !e.isFeatured);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#555' }}>Loading events...</div>;

  const renderEventCard = (event, isFeaturedCard) => {
    const ticketsLeft = event.totalTickets - (event.soldTickets || 0);
    return (
      <div key={event._id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: isFeaturedCard ? '0 10px 30px rgba(211, 84, 0, 0.15)' : '0 10px 30px rgba(0,0,0,0.08)', border: isFeaturedCard ? '2px solid #d35400' : 'none', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease', position: 'relative' }}
           onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
        
        {isFeaturedCard && (
          <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#d35400', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            🌟 Featured
          </div>
        )}

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
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#2c3e50', fontSize: '3.5rem', margin: '0 0 10px 0', fontWeight: '800', letterSpacing: '-1px' }}>Cinnamon & Co.</h1>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d', fontWeight: '500' }}>Discover and book the best coffeehouse events in town.</p>
      </div>

      {/* --- UPGRADED FILTER & SEARCH BAR SECTION --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '50px', backgroundColor: '#fff', padding: '20px 25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
        
        {/* Text Search Bar */}
        <div style={{ flex: '1 1 350px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#95a5a6' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search for an event..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '14px 16px 14px 45px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '15px', backgroundColor: '#f8f9fa', outline: 'none', transition: 'border 0.2s ease', boxSizing: 'border-box' }}
          />
        </div>

        {/* Date Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: '1 1 250px' }}>
          <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Filter Date</label>
          <select 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '15px', cursor: 'pointer', backgroundColor: '#f8f9fa', outline: 'none', color: '#2c3e50', fontWeight: '600' }}
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

      </div>

      {displayedEvents.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.2rem', marginTop: '40px', fontWeight: '500' }}>
          No events currently match your search.
        </p>
      ) : (
        <>
          {featuredEvents.length > 0 && (
            <div style={{ marginBottom: '60px' }}>
              <h2 style={{ color: '#d35400', fontSize: '2rem', fontWeight: '800', marginBottom: '25px', borderBottom: '2px solid #fff3e0', paddingBottom: '10px' }}>
                🌟 Featured Events
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
                {featuredEvents.map(event => renderEventCard(event, true))}
              </div>
            </div>
          )}

          {regularEvents.length > 0 && (
            <div>
              <h2 style={{ color: '#2c3e50', fontSize: '2rem', fontWeight: '800', marginBottom: '25px', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
                {featuredEvents.length > 0 ? "More Upcoming Events" : "All Events"}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
                {regularEvents.map(event => renderEventCard(event, false))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;