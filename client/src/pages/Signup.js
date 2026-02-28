import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    adminKey: '' // <--- New State
  });
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/register', formData);
      alert('Registration Successful! Please Login.');
      navigate('/login');
    } catch (err) {
      alert('Error registering user');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <form onSubmit={handleSubmit} style={{ width: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center', color: '#d35400' }}>Sign Up</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Username</label>
          <input 
            type="text" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required 
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input 
            type="email" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input 
            type="password" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />
        </div>

        {/* SECRET ADMIN FIELD */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#777', fontSize: '12px' }}>Admin Key (Optional)</label>
          <input 
            type="text" 
            placeholder="For admins only..."
            style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px dashed #ccc' }}
            onChange={(e) => setFormData({...formData, adminKey: e.target.value})}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#d35400', color: 'white', border: 'none', cursor: 'pointer' }}>
          Register
        </button>
      </form>
    </div>
  );
}

export default Signup;