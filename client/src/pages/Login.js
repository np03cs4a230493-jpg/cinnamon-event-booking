import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google'; // <--- NEW IMPORT

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  // --- NORMAL LOGIN ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/login', formData);
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage"));
      alert(`Welcome back, ${response.data.username}!`);
      navigate('/'); 
    } catch (err) {
      alert('Invalid Email or Password');
    }
  };

  // --- NEW: GOOGLE LOGIN ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Send the secure Google token to our backend
      const response = await axios.post('http://localhost:5001/api/google-login', {
        token: credentialResponse.credential
      });
      
      // Save user and redirect just like a normal login!
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage"));
      alert(`Welcome, ${response.data.username}!`);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Google Login Failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <div style={{ width: '320px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        
        <form onSubmit={handleSubmit}>
          <h2 style={{ textAlign: 'center', color: '#d35400', marginTop: 0 }}>Login</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Email</label>
            <input 
              type="email" 
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Password</label>
            <input 
              type="password" 
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#d35400', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            Login
          </button>
        </form>

        {/* --- NEW: GOOGLE BUTTON SECTION --- */}
        <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ marginBottom: '15px', color: '#777', fontSize: '14px' }}>Or continue with</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert('Google Login Failed')}
              useOneTap
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;