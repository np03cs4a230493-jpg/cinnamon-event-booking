import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css'; 

function Home() {
  // THIS LINE WAS MISSING: We need this to store the events from the database
  const [events, setEvents] = useState([]);

  // Fetch events when the page loads
  useEffect(() => {
    axios.get('http://localhost:5001/api/events')
      .then(res => setEvents(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div>
      {/* 1. THE HERO BANNER */}
      <div className="hero">
        <h1>Cinnamon & Co.</h1>
        <p>Experience the art of coffee, community, and culture.</p>
      </div>

      {/* 2. THE EVENT GRID */}
      <div className="container">
        <h2 style={{ borderLeft: '5px solid #d35400', paddingLeft: '15px', color: '#333' }}>
          Upcoming Events
        </h2>
        
        <div className="event-grid">
          {events.map(event => (
            <Link to={`/event/${event._id}`} key={event._id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="event-card">
                <img src={event.image} alt={event.title} />
                <div className="event-details">
                  <h3 className="event-title">{event.title}</h3>
                  <div className="event-info">
                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    <span className="price-tag">{event.price === 0 ? "FREE" : `NPR ${event.price}`}</span>
                  </div>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {event.description.substring(0, 60)}...
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;