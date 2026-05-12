import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 

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
        email: user ? user.email : null 
      });
      toast.success("Thanks for your idea! We'll look into it."); 
      navigate('/');
    } catch (err) {
      toast.error("Something went wrong. Try again."); 
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px', marginBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '600px', padding: '40px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        
        <h2 style={{ color: '#2c3e50', textAlign: 'center', fontSize: '28px', fontWeight: '800', marginTop: 0, marginBottom: '10px' }}>
          💡 Suggest an Event
        </h2>
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '35px', fontSize: '15px', lineHeight: '1.5' }}>
          Want a Jazz Night? A Poetry Slam? Tell us what you want to see at Cinnamon & Co.!
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={labelStyle}>Event Title Idea</label>
            <input 
              type="text" 
              placeholder="e.g. '80s Disco Night'" 
              required 
              style={inputStyle}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div>
            <label style={labelStyle}>The Vibe / Description</label>
            <textarea 
              placeholder="Describe your idea... (What kind of music? What vibe?)" 
              required 
              style={{ ...inputStyle, height: '140px', resize: 'vertical', fontFamily: 'inherit' }}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <button type="submit" style={buttonStyle}>Send Idea</button>
        </form>

      </div>
    </div>
  );
}

// Reusable clean styles
const labelStyle = { fontSize: '13px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', marginTop: '8px', borderRadius: '8px', border: '1px solid #e0e6ed', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease' };
const buttonStyle = { width: '100%', padding: '14px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.2s ease', boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)' };

export default Suggest;