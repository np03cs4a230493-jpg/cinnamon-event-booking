import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Suggest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
      await axios.post('http://localhost:5001/api/suggestions', {
        ...formData,
        username: user ? user.username : 'Anonymous',
        email: user ? user.email : null // <--- NEW: Grab their email so we can notify them!
      });
      alert("Thanks for your idea! We'll look into it.");
      navigate('/');
    } catch (err) {
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#d35400', textAlign: 'center' }}>💡 Suggest an Event</h2>
      <p style={{ textAlign: 'center', color: '#777', marginBottom: '30px' }}>
        Want a Jazz Night? A Poetry Slam? Tell us what you want to see at Cinnamon & Co.!
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Event Title Idea (e.g. '80s Disco Night')" 
          required 
          style={inputStyle}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
        
        <textarea 
          placeholder="Describe your idea... (What kind of music? What vibe?)" 
          required 
          style={{ ...inputStyle, height: '120px' }}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        ></textarea>

        <button type="submit" style={buttonStyle}>Send Idea</button>
      </form>
    </div>
  );
}

const inputStyle = { padding: '15px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '1rem' };
const buttonStyle = { padding: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' };

export default Suggest;