import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ eventStats: [], grandTotal: { revenue: 0, sold: 0 } });
  const [suggestions, setSuggestions] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [file, setFile] = useState(null);

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Security Check
      const storedUser = localStorage.getItem('user');
      if (!storedUser || JSON.parse(storedUser).role !== 'admin') {
        navigate('/'); 
        return;
      }

      try {
        // 2. Fetch All Data in Parallel
        const [eventRes, statsRes, suggRes] = await Promise.all([
          axios.get('http://localhost:5001/api/events'),
          axios.get('http://localhost:5001/api/admin/analytics'),
          axios.get('http://localhost:5001/api/admin/suggestions')
        ]);

        setEvents(eventRes.data);
        setStats(statsRes.data);
        setSuggestions(suggRes.data);
      } catch (err) {
        console.error("Error fetching admin data", err);
      }
    };
    fetchData();
  }, [navigate]);

  // --- HANDLERS: EVENTS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', date);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('totalTickets', totalTickets);
    if (file) formData.append('image', file);

    try {
      await axios.post('http://localhost:5001/api/events', formData);
      alert("Event Created Successfully!");
      window.location.reload(); 
    } catch (err) { 
      alert("Error creating event"); 
    }
  };

  // --- HANDLERS: SUGGESTIONS ---
  const handleAcknowledge = async (id) => {
    try {
      await axios.patch(`http://localhost:5001/api/suggestions/${id}`, { status: 'accepted' });
      
      // --- NEW: Auto-fill the form! ---
      const acceptedSuggestion = suggestions.find(s => s._id === id);
      if (acceptedSuggestion) {
        setTitle(acceptedSuggestion.title);
        setDescription(acceptedSuggestion.description);
        
        // Smoothly scroll down to the Create Event form
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }

      // Update UI instantly
      setSuggestions(suggestions.map(s => 
        s._id === id ? { ...s, status: 'accepted' } : s
      ));
    } catch (err) { alert("Error updating status"); }
  };

  const handleDecline = async (id) => {
    if (window.confirm("Delete this suggestion permanently?")) {
      try {
        await axios.delete(`http://localhost:5001/api/suggestions/${id}`);
        // Remove from UI instantly
        setSuggestions(suggestions.filter(s => s._id !== id));
      } catch (err) { alert("Error deleting suggestion"); }
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>Admin Dashboard</h1>

      {/* --- SECTION 1: ANALYTICS CARDS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {/* Revenue */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>TOTAL REVENUE</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60', margin: '10px 0' }}>
            NPR {stats.grandTotal.revenue}
          </p>
        </div>
        {/* Tickets Sold */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>TICKETS SOLD</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d35400', margin: '10px 0' }}>
            {stats.grandTotal.sold}
          </p>
        </div>
         {/* Active Events */}
         <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>ACTIVE EVENTS</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2980b9', margin: '10px 0' }}>
            {events.length}
          </p>
        </div>
      </div>

      {/* --- SECTION 2: COMMUNITY SUGGESTIONS --- */}
      <div style={{ marginBottom: '50px' }}>
        <h3 style={{ color: '#34495e', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
          Community Suggestions 💡
        </h3>
        
        {suggestions.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No suggestions received yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {suggestions.map(sugg => (
              <div key={sugg._id} style={{ 
                backgroundColor: '#fff', 
                padding: '20px', 
                borderRadius: '8px', 
                borderLeft: `5px solid ${sugg.status === 'accepted' ? '#27ae60' : '#f1c40f'}`, 
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                    {sugg.title} 
                    {sugg.status === 'accepted' && <span style={{ marginLeft: '10px', fontSize: '0.7rem', backgroundColor: '#27ae60', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>ACCEPTED</span>}
                  </h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#95a5a6', marginBottom: '10px' }}>
                  Suggested by: <strong>{sugg.username}</strong>
                </p>
                <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.4' }}>"{sugg.description}"</p>

                {/* Buttons: Only show if NOT accepted yet */}
                {sugg.status !== 'accepted' && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleAcknowledge(sugg._id)} style={{ ...actionBtnStyle, backgroundColor: '#27ae60' }}>
                      ✅ Acknowledge
                    </button>
                    <button onClick={() => handleDecline(sugg._id)} style={{ ...actionBtnStyle, backgroundColor: '#e74c3c' }}>
                      ❌ Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

   {/* --- SECTION 3: SALES TABLE --- */}
      <h3 style={{ color: '#34495e' }}>Sales Performance</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '50px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left' }}>
              <th style={thStyle}>Event</th>
              <th style={thStyle}>Sold</th>
              <th style={thStyle}>Revenue</th>
              <th style={thStyle}>Remaining</th>
              <th style={thStyle}>Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {stats.eventStats.map((stat, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}><strong>{stat.title}</strong></td>
                <td style={tdStyle}>{stat.sold}</td>
                <td style={{...tdStyle, color: '#27ae60', fontWeight: 'bold'}}>NPR {stat.revenue}</td>
                <td style={tdStyle}><span style={{ color: stat.left < 10 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{stat.left}</span></td>
                <td style={tdStyle}>
                  <div style={{ background: '#ecf0f1', borderRadius: '10px', height: '8px', width: '100px' }}>
                    <div style={{ background: '#3498db', borderRadius: '10px', height: '100%', width: `${stat.percent}%` }}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- SECTION 4: ADD EVENT FORM --- */}
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Create New Event</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Event Title</label>
            {/* Added value={title} */}
            <input type="text" value={title} placeholder="e.g. Latte Art Workshop" required style={inputStyle} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" required style={inputStyle} onChange={e => setDate(e.target.value)} />
          </div>

          <div>
             <label style={labelStyle}>Event Image</label>
             <input type="file" accept="image/*" style={{ ...inputStyle, padding: '7px' }} onChange={e => setFile(e.target.files[0])} />
          </div>

          <div>
            <label style={labelStyle}>Price (NPR)</label>
            <input type="number" placeholder="500" required style={inputStyle} onChange={e => setPrice(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Total Tickets</label>
            <input type="number" placeholder="50" required style={inputStyle} onChange={e => setTotalTickets(e.target.value)} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description</label>
            {/* Added value={description} */}
            <textarea value={description} placeholder="Describe the event details..." required style={{ ...inputStyle, height: '100px', fontFamily: 'inherit' }} onChange={e => setDescription(e.target.value)}></textarea>
          </div>

          <button type="submit" style={buttonStyle}>Publish Event</button>
        </form>
      </div>
    </div>
  );
}

// --- CSS STYLES ---
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dfe6e9', fontSize: '1rem', transition: 'border 0.2s' };
const buttonStyle = { gridColumn: '1 / -1', padding: '14px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' };
const thStyle = { padding: '15px', borderBottom: '2px solid #dfe6e9', color: '#7f8c8d', fontSize: '0.9rem', textTransform: 'uppercase' };
const tdStyle = { padding: '15px', color: '#2c3e50', borderBottom: '1px solid #f1f2f6' };
const actionBtnStyle = { color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' };

export default Admin;