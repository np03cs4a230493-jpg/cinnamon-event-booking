import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Admin() {
  const navigate = useNavigate();
  
  // --- NEW: TAB STATE ---
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'manager', 'guests', 'suggestions'

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

      // --- NEW: Instantly switch to the Manager tab when Edit is clicked ---
      setActiveTab('manager');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle(''); setDate(''); setPrice(''); setTotalTickets(''); setDescription(''); setFile(null);
    setActiveTab('dashboard'); // Jump back to dashboard when canceled
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
        toast.success("Event Updated Successfully!"); // <--- TOAST
      } else {
        await axios.post('http://localhost:5001/api/events', formData);
        toast.success("Event Created Successfully!"); // <--- TOAST
      }
      setTimeout(() => window.location.reload(), 1500); // Give the toast 1.5s to show before reloading!
    } catch (err) { 
      toast.error("Error saving event"); // <--- TOAST
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
      toast.success("Suggestion Acknowledged!"); // <--- TOAST
    } catch (err) { 
      toast.error("Error updating status"); // <--- TOAST
    }
  };

const handleDecline = async (id) => {
    if (window.confirm("Delete this suggestion permanently?")) {
      try {
        await axios.delete(`http://localhost:5001/api/suggestions/${id}`);
        setSuggestions(suggestions.filter(s => s._id !== id));
        toast.success("Suggestion Deleted."); // <--- TOAST
      } catch (err) { 
        toast.error("Error deleting suggestion"); // <--- TOAST
      }
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Admin Dashboard</h1>

      {/* --- NEW: TAB NAVIGATION BAR --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('dashboard')} style={getTabStyle(activeTab === 'dashboard')}>📊 Overview</button>
        <button onClick={() => setActiveTab('manager')} style={getTabStyle(activeTab === 'manager')}>🛠️ Event Manager</button>
        <button onClick={() => setActiveTab('guests')} style={getTabStyle(activeTab === 'guests')}>📝 Guest List</button>
        <button onClick={() => setActiveTab('suggestions')} style={getTabStyle(activeTab === 'suggestions')}>
          💡 Suggestions {suggestions.filter(s => s.status !== 'accepted').length > 0 && `(${suggestions.filter(s => s.status !== 'accepted').length})`}
        </button>
      </div>

      {/* =========================================
             TAB 1: DASHBOARD OVERVIEW 
          ========================================= */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={cardStyle}>
              <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>TOTAL REVENUE</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60', margin: '10px 0' }}>NPR {stats.grandTotal.revenue}</p>
            </div>
            <div style={cardStyle}>
              <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>TICKETS SOLD</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d35400', margin: '10px 0' }}>{stats.grandTotal.sold}</p>
            </div>
             <div style={cardStyle}>
              <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>ACTIVE EVENTS</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2980b9', margin: '10px 0' }}>{events.length}</p>
            </div>
          </div>

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
                  <th style={thStyle}>Action</th>
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
                    <td style={tdStyle}>
                       <button onClick={() => handleEditClick(stat._id)} style={{ color: '#3498db', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                         ✏️ Edit
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
        <div style={{ backgroundColor: editingId ? '#fff3e0' : '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'background-color 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{editingId ? '✏️ Edit Event' : 'Create New Event'}</h3>
            {editingId && (
              <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}>✖ Cancel Edit</button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '15px' }}>
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
               <input type="file" accept="image/*" style={{ ...inputStyle, padding: '7px' }} onChange={e => setFile(e.target.files[0])} />
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
              <textarea value={description} placeholder="Describe the event details..." required style={{ ...inputStyle, height: '100px', fontFamily: 'inherit' }} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <button type="submit" style={{...buttonStyle, backgroundColor: editingId ? '#d35400' : '#27ae60'}}>
              {editingId ? 'Update Event Details' : 'Publish Event'}
            </button>
          </form>
        </div>
      )}

      {/* =========================================
             TAB 3: GUEST LIST
          ========================================= */}
      {activeTab === 'guests' && (
        <div>
          <h3 style={{ color: '#34495e', marginBottom: '20px' }}>Recent Bookings & Guest List</h3>
          <div style={{ overflowX: 'auto', marginBottom: '50px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left' }}>
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
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>
                        <strong>{booking.user?.username || 'Unknown'}</strong><br/>
                        <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{booking.user?.email || 'N/A'}</span>
                      </td>
                      <td style={tdStyle}>{booking.event?.title || 'Event Removed'}</td>
                      <td style={{...tdStyle, fontWeight: 'bold', color: '#d35400'}}>{booking.quantity}</td>
                      <td style={tdStyle}>{new Date(booking.bookingDate).toLocaleDateString()}</td>
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
          <h3 style={{ color: '#34495e', marginBottom: '20px' }}>Community Suggestions 💡</h3>
          {suggestions.length === 0 ? (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No suggestions received yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {suggestions.map(sugg => (
                <div key={sugg._id} style={{ 
                  backgroundColor: '#fff', padding: '20px', borderRadius: '8px', 
                  borderLeft: `5px solid ${sugg.status === 'accepted' ? '#27ae60' : '#f1c40f'}`, 
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                    {sugg.title} 
                    {sugg.status === 'accepted' && <span style={{ marginLeft: '10px', fontSize: '0.7rem', backgroundColor: '#27ae60', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>ACCEPTED</span>}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#95a5a6', marginBottom: '10px' }}>By: <strong>{sugg.username}</strong></p>
                  <p style={{ color: '#555', fontSize: '0.95rem' }}>"{sugg.description}"</p>

                  {sugg.status !== 'accepted' && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleAcknowledge(sugg._id)} style={{ ...actionBtnStyle, backgroundColor: '#27ae60' }}>✅ Acknowledge</button>
                      <button onClick={() => handleDecline(sugg._id)} style={{ ...actionBtnStyle, backgroundColor: '#e74c3c' }}>❌ Decline</button>
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

// --- CSS STYLES ---
const getTabStyle = (isActive) => ({
  padding: '10px 20px',
  backgroundColor: isActive ? '#2c3e50' : 'transparent',
  color: isActive ? 'white' : '#7f8c8d',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap'
});

const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dfe6e9', fontSize: '1rem', transition: 'border 0.2s' };
const buttonStyle = { gridColumn: '1 / -1', padding: '14px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' };
const thStyle = { padding: '15px', borderBottom: '2px solid #dfe6e9', color: '#7f8c8d', fontSize: '0.9rem', textTransform: 'uppercase' };
const tdStyle = { padding: '15px', color: '#2c3e50', borderBottom: '1px solid #f1f2f6' };
const actionBtnStyle = { color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' };

export default Admin;