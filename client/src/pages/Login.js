import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google'; 
import toast from 'react-hot-toast'; // <--- NEW IMPORT

function Login() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/login', formData);
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage"));
      
      // --- NEW: SUCCESS TOAST ---
      toast.success(`Welcome back, ${response.data.username}!`);
      navigate('/'); 
    } catch (err) {
      // --- NEW: ERROR TOAST ---
      toast.error('Invalid Email/Username or Password');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('http://localhost:5001/api/google-login', {
        token: credentialResponse.credential
      });
      
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage"));
      
      // --- NEW: SUCCESS TOAST ---
      toast.success(`Welcome, ${response.data.username}!`);
      navigate('/');
    } catch (err) {
      console.error(err);
      // --- NEW: ERROR TOAST ---
      toast.error('Google Login Failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <div style={{ width: '320px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        
        <form onSubmit={handleSubmit}>
          <h2 style={{ textAlign: 'center', color: '#d35400', marginTop: 0 }}>Login</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Email or Username</label>
            <input 
              type="text" 
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
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

        <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ marginBottom: '15px', color: '#777', fontSize: '14px' }}>Or continue with</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Login Failed')} // <-- Updated here too!
              useOneTap
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;