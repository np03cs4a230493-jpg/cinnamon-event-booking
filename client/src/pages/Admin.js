import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Admin() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- STATE MANAGEMENT ---
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ eventStats: [], grandTotal: { revenue: 0, sold: 0 } });
  const [suggestions, setSuggestions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser || JSON.parse(storedUser).role !== 'admin') {
        navigate('/'); 
        return;
      }

      try {
        const [eventRes, statsRes, suggRes, bookingsRes] = await Promise.all([
          axios.get('http://localhost:5001/api/events'),
          axios.get('http://localhost:5001/api/admin/analytics'),
          axios.get('http://localhost:5001/api/admin/suggestions'),
          axios.get('http://localhost:5001/api/admin/bookings') 
        ]);

        setEvents(eventRes.data);
        setStats(statsRes.data);
        setSuggestions(suggRes.data);
        setBookings(bookingsRes.data);
      } catch (err) {
        console.error("Error fetching admin data", err);
      }
    };
    fetchData();
  }, [navigate]);

  // --- HANDLERS ---
  const handleEditClick = (id) => {
    const eventToEdit = events.find(e => e._id === id);
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setPrice(eventToEdit.price);
      setTotalTickets(eventToEdit.totalTickets);
      setDescription(eventToEdit.description);
      setEditingId(eventToEdit._id);

      const d = new Date(eventToEdit.date);
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setDate(formattedDate);

      setActiveTab('manager');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle(''); setDate(''); setPrice(''); setTotalTickets(''); setDescription(''); setFile(null);
    setActiveTab('dashboard'); 
  };

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
      if (editingId) {
        await axios.put(`http://localhost:5001/api/events/${editingId}`, formData);
        toast.success("Event Updated Successfully!");
      } else {
        await axios.post('http://localhost:5001/api/events', formData);
        toast.success("Event Created Successfully!");
      }
      setTimeout(() => window.location.reload(), 1500); 
    } catch (err) { 
      toast.error("Error saving event"); 
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await axios.patch(`http://localhost:5001/api/suggestions/${id}`, { status: 'accepted' });
      const acceptedSuggestion = suggestions.find(s => s._id === id);
      if (acceptedSuggestion) {
        setTitle(acceptedSuggestion.title);
        setDescription(acceptedSuggestion.description);
        setActiveTab('manager'); 
      }
      setSuggestions(suggestions.map(s => s._id === id ? { ...s, status: 'accepted' } : s));
      toast.success("Suggestion Acknowledged!");
    } catch (err) { 
      toast.error("Error updating status"); 
    }
  };

  const handleDecline = async (id) => {
    if (window.confirm("Delete this suggestion permanently?")) {
      try {
        await axios.delete(`http://localhost:5001/api/suggestions/${id}`);
        setSuggestions(suggestions.filter(s => s._id !== id));
        toast.success("Suggestion Deleted.");
      } catch (err) { 
        toast.error("Error deleting suggestion"); 
      }
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', fontSize: '2.8rem', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' }}>Admin Dashboard</h1>
      </div>

      {/* --- TAB NAVIGATION BAR --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', paddingBottom: '15px', overflowX: 'auto', borderBottom: '2px solid #ecf0f1' }}>
        <button onClick={() => setActiveTab('dashboard')} style={getTabStyle(activeTab === 'dashboard')}>📊 Overview</button>
        <button onClick={() => setActiveTab('manager')} style={getTabStyle(activeTab === 'manager')}>🛠️ Event Manager</button>
        <button onClick={() => setActiveTab('guests')} style={getTabStyle(activeTab === 'guests')}>📝 Guest List</button>
        <button onClick={() => setActiveTab('suggestions')} style={getTabStyle(activeTab === 'suggestions')}>
          💡 Suggestions {suggestions.filter(s => s.status !== 'accepted').length > 0 && <span style={badgeStyle}>{suggestions.filter(s => s.status !== 'accepted').length}</span>}
        </button>
      </div>

      {/* =========================================
             TAB 1: DASHBOARD OVERVIEW 
          ========================================= */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '50px' }}>
            <div style={cardStyle} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <h3 style={{ margin: 0, color: '#95a5a6', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#27ae60', margin: '15px 0 0 0' }}>NPR {stats.grandTotal.revenue}</p>
            </div>
            <div style={cardStyle} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <h3 style={{ margin: 0, color: '#95a5a6', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tickets Sold</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#d35400', margin: '15px 0 0 0' }}>{stats.grandTotal.sold}</p>
            </div>
             <div style={cardStyle} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <h3 style={{ margin: 0, color: '#95a5a6', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Events</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#2980b9', margin: '15px 0 0 0' }}>{events.length}</p>
            </div>
          </div>

          <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800', marginBottom: '20px' }}>Sales Performance</h3>
          <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Event</th>
                  <th style={thStyle}>Sold</th>
                  <th style={thStyle}>Revenue</th>
                  <th style={thStyle}>Remaining</th>
                  <th style={thStyle}>Occupancy</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.eventStats.length === 0 ? (
                  <tr><td colSpan="6" style={{...tdStyle, textAlign: 'center', color: '#7f8c8d'}}>No event data.</td></tr>
                ) : stats.eventStats.map((stat, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f2f6', transition: 'background 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{...tdStyle, fontWeight: '700'}}>{stat.title}</td>
                    <td style={tdStyle}>{stat.sold}</td>
                    <td style={{...tdStyle, color: '#27ae60', fontWeight: '800'}}>NPR {stat.revenue}</td>
                    <td style={tdStyle}><span style={{ color: stat.left < 10 ? '#e74c3c' : '#27ae60', fontWeight: '800' }}>{stat.left}</span></td>
                    <td style={tdStyle}>
                      <div style={{ background: '#ecf0f1', borderRadius: '10px', height: '8px', width: '100px', overflow: 'hidden' }}>
                        <div style={{ background: '#3498db', height: '100%', width: `${stat.percent}%`, borderRadius: '10px' }}></div>
                      </div>
                    </td>
                    <td style={{...tdStyle, textAlign: 'right'}}>
                       <button onClick={() => handleEditClick(stat._id)} style={{ color: '#3498db', background: '#e8f4f8', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                         Edit
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
             TAB 2: EVENT MANAGER (ADD/EDIT) 
          ========================================= */}
      {activeTab === 'manager' && (
        <div style={{ backgroundColor: editingId ? '#fff3e0' : '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', transition: 'background-color 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.8rem', fontWeight: '800' }}>{editingId ? 'Edit Event Details' : 'Create New Event'}</h3>
            {editingId && (
              <button onClick={handleCancelEdit} style={{ background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel Edit</button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Event Title</label>
              <input type="text" value={title} placeholder="e.g. Latte Art Workshop" required style={inputStyle} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} required style={inputStyle} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
               <label style={labelStyle}>{editingId ? 'Update Image (Optional)' : 'Event Image'}</label>
               <input type="file" accept="image/*" style={{ ...inputStyle, padding: '11px' }} onChange={e => setFile(e.target.files[0])} />
            </div>
            <div>
              <label style={labelStyle}>Price (NPR)</label>
              <input type="number" value={price} placeholder="500" required style={inputStyle} onChange={e => setPrice(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Total Tickets</label>
              <input type="number" value={totalTickets} placeholder="50" required style={inputStyle} onChange={e => setTotalTickets(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={description} placeholder="Describe the event details..." required style={{ ...inputStyle, height: '120px', resize: 'vertical' }} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <button type="submit" style={{...buttonStyle, backgroundColor: editingId ? '#d35400' : '#27ae60'}}>
              {editingId ? 'Save Changes' : 'Publish Event'}
            </button>
          </form>
        </div>
      )}

      {/* =========================================
             TAB 3: GUEST LIST
          ========================================= */}
      {activeTab === 'guests' && (
        <div>
          <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800', marginBottom: '20px' }}>Recent Bookings</h3>
          <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Event</th>
                  <th style={thStyle}>Tickets</th>
                  <th style={thStyle}>Date Booked</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan="4" style={{...tdStyle, textAlign: 'center', color: '#7f8c8d'}}>No bookings yet.</td></tr>
                ) : (
                  bookings.map((booking, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f2f6', transition: 'background 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={tdStyle}>
                        <strong style={{ color: '#2c3e50', fontWeight: '700' }}>{booking.user?.username || 'Unknown'}</strong><br/>
                        <span style={{ fontSize: '13px', color: '#95a5a6' }}>{booking.user?.email || 'N/A'}</span>
                      </td>
                      <td style={{...tdStyle, fontWeight: '500'}}>{booking.event?.title || 'Event Removed'}</td>
                      <td style={{...tdStyle, fontWeight: '800', color: '#d35400'}}>{booking.quantity}</td>
                      <td style={{...tdStyle, color: '#7f8c8d'}}>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
             TAB 4: SUGGESTIONS
          ========================================= */}
      {activeTab === 'suggestions' && (
        <div>
          <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', fontWeight: '800', marginBottom: '20px' }}>Community Suggestions</h3>
          {suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <p style={{ color: '#7f8c8d', fontStyle: 'italic', fontSize: '1.1rem' }}>No suggestions received yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {suggestions.map(sugg => (
                <div key={sugg._id} style={{ 
                  backgroundColor: '#fff', padding: '25px', borderRadius: '16px', 
                  borderTop: `6px solid ${sugg.status === 'accepted' ? '#27ae60' : '#f1c40f'}`, 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '800' }}>
                    {sugg.title} 
                    {sugg.status === 'accepted' && <span style={{ marginLeft: '10px', fontSize: '11px', backgroundColor: '#e8f8f5', color: '#27ae60', padding: '4px 8px', borderRadius: '12px', verticalAlign: 'middle' }}>ACCEPTED</span>}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#95a5a6', marginBottom: '15px' }}>Suggested by: <strong style={{ color: '#2c3e50' }}>{sugg.username}</strong></p>
                  <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.5', flexGrow: 1, margin: '0 0 20px 0' }}>"{sugg.description}"</p>

                  {sugg.status !== 'accepted' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleAcknowledge(sugg._id)} style={{ ...actionBtnStyle, backgroundColor: '#27ae60', flex: 1 }}>Accept & Draft</button>
                      <button onClick={() => handleDecline(sugg._id)} style={{ ...actionBtnStyle, backgroundColor: '#e74c3c', flex: 1 }}>Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- MODERNIZED CSS STYLES ---
const getTabStyle = (isActive) => ({
  padding: '12px 24px',
  backgroundColor: isActive ? '#2c3e50' : '#f8f9fa',
  color: isActive ? 'white' : '#7f8c8d',
  border: '1px solid',
  borderColor: isActive ? '#2c3e50' : '#ecf0f1',
  borderRadius: '30px',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
  boxShadow: isActive ? '0 4px 10px rgba(44, 62, 80, 0.2)' : 'none'
});

const badgeStyle = {
  backgroundColor: '#e74c3c',
  color: 'white',
  borderRadius: '12px',
  padding: '2px 8px',
  fontSize: '11px',
  marginLeft: '8px',
  fontWeight: '800'
};

const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', textAlign: 'center', transition: 'transform 0.2s ease' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '13px', color: '#7f8c8d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const buttonStyle = { gridColumn: '1 / -1', padding: '16px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', marginTop: '10px', transition: 'transform 0.2s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const thStyle = { padding: '20px', borderBottom: '2px solid #f1f2f6', color: '#95a5a6', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' };
const tdStyle = { padding: '20px', color: '#2c3e50', fontSize: '15px' };
const actionBtnStyle = { color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'opacity 0.2s ease' };

export default Admin;