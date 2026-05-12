import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import { GoogleLogin } from '@react-oauth/google'; 
import toast from 'react-hot-toast'; 

function Login() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/login', formData);
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage"));
      toast.success(`Welcome back, ${response.data.username}!`);
      navigate('/'); 
    } catch (err) {
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
      toast.success(`Welcome, ${response.data.username}!`);
      navigate('/');
    } catch (err) {
      toast.error('Google Login Failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '80px', marginBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Sleek, borderless card with soft shadow */}
      <div style={{ width: '380px', padding: '40px', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        
        <form onSubmit={handleSubmit}>
          <h2 style={{ textAlign: 'center', color: '#2c3e50', marginTop: 0, marginBottom: '30px', fontSize: '28px', fontWeight: '800' }}>
            Welcome Back
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email or Username</label>
            <input 
              type="text" 
              placeholder="Enter your email or username"
              style={inputStyle}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
              required 
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: '#d35400', textDecoration: 'none', fontWeight: '600' }}>
                Forgot?
              </Link>
            </div>
            <input 
              type="password" 
              placeholder="••••••••"
              style={inputStyle}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>

          <button type="submit" style={buttonStyle}>
            Log In
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          {/* Beautiful horizontal divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' }}>
            <div style={{ height: '1px', backgroundColor: '#ecf0f1', flex: 1 }}></div>
            <span style={{ padding: '0 15px', color: '#bdc3c7', fontSize: '13px', fontWeight: '600' }}>OR</span>
            <div style={{ height: '1px', backgroundColor: '#ecf0f1', flex: 1 }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Login Failed')} 
              useOneTap
              shape="rectangular"
            />
          </div>
          
          <p style={{ marginTop: '30px', fontSize: '14px', color: '#7f8c8d' }}>
            Don't have an account? <Link to="/signup" style={{ color: '#d35400', textDecoration: 'none', fontWeight: 'bold' }}>Sign up</Link>
          </p>
        </div>

      </div>
    </div>
  );
}

// Reusable clean styles
const inputStyle = { width: '100%', padding: '14px', marginTop: '8px', borderRadius: '8px', border: '1px solid #e0e6ed', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease' };
const buttonStyle = { width: '100%', padding: '14px', backgroundColor: '#d35400', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.2s ease', boxShadow: '0 4px 6px rgba(211, 84, 0, 0.2)' };

export default Login;