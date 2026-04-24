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
    const { username, email, password } = formData;

    // --- 1. EMAIL VALIDATION REGEX ---
    // Checks for: text + @ + text + . + text
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("❌ Please enter a valid email address.");
      return; // Stops the function right here!
    }

    // --- 2. PASSWORD VALIDATION REGEX ---
    // Checks for: Minimum 8 characters, at least one letter, and at least one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("❌ Password must be at least 8 characters long and include at least one letter and one number.");
      return; // Stops the function right here!
    }

    // --- 3. PROCEED WITH REGISTRATION ---
    try {
      await axios.post('http://localhost:5001/api/register', { username, email, password });
      alert("✅ Account created successfully!");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
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