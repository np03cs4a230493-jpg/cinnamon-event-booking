import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/login', formData);
      
      // NEW: Save the user's name and email in the browser's memory
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Trigger a storage event so the Navbar updates immediately
      window.dispatchEvent(new Event("storage"));

      alert(`Welcome back, ${response.data.username}!`);
      navigate('/'); 
    } catch (err) {
      alert('Invalid Email or Password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <form onSubmit={handleSubmit} style={{ width: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center', color: '#d35400' }}>Login</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input 
            type="email" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Password</label>
          <input 
            type="password" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#d35400', color: 'white', border: 'none', cursor: 'pointer' }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;