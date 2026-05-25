import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import { GoogleLogin } from '@react-oauth/google'; 
import toast from 'react-hot-toast'; 

function Login() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  
  // --- NEW: Handle Verification States ---
  const [step, setStep] = useState(1); 
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.identifier.includes('@')) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.identifier)) {
        toast.error("Please enter a valid email address (e.g., name@domain.com).");
        return;
      }
    }

    try {
      const response = await axios.post('/api/login', formData);
      localStorage.setItem('user', JSON.stringify(response.data));
      window.dispatchEvent(new Event("storage"));
      toast.success(`Welcome back, ${response.data.username}!`);
      navigate('/'); 
    } catch (err) {
      // --- Catch Unverified Error and switch to Step 2 ---
      if (err.response?.status === 403) {
        setUnverifiedEmail(err.response.data.email);
        setStep(2);
        toast.error("Please verify your email address first!");
      } else {
        toast.error('Invalid Email/Username or Password');
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/verify-email', { 
        email: unverifiedEmail, 
        code: verificationCode 
      });
      
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event("storage"));
      toast.success("Email verified! Welcome back.");
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid verification code.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('/api/google-login', {
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
      <div style={{ width: '380px', padding: '40px', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        
        {step === 1 ? (
          <>
            <form onSubmit={handleSubmit}>
              <h2 style={{ textAlign: 'center', color: '#2c3e50', marginTop: 0, marginBottom: '30px', fontSize: '28px', fontWeight: '800' }}>Welcome Back</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email or Username</label>
                <input type="text" placeholder="Enter your email or username" style={inputStyle} onChange={(e) => setFormData({...formData, identifier: e.target.value})} required />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{...labelStyle, marginBottom: 0}}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '13px', color: '#d35400', textDecoration: 'none', fontWeight: '600' }}>Forgot?</Link>
                </div>
                <input type="password" placeholder="••••••••" style={inputStyle} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>

              <button type="submit" style={buttonStyle}>Log In</button>
            </form>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' }}>
                <div style={{ height: '1px', backgroundColor: '#ecf0f1', flex: 1 }}></div>
                <span style={{ padding: '0 15px', color: '#bdc3c7', fontSize: '13px', fontWeight: '600' }}>OR</span>
                <div style={{ height: '1px', backgroundColor: '#ecf0f1', flex: 1 }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google Login Failed')} useOneTap shape="rectangular" />
              </div>
              
              <p style={{ marginTop: '30px', fontSize: '14px', color: '#7f8c8d' }}>
                Don't have an account? <Link to="/signup" style={{ color: '#d35400', textDecoration: 'none', fontWeight: 'bold' }}>Sign up</Link>
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ textAlign: 'center', color: '#2c3e50', marginTop: 0, marginBottom: '10px', fontSize: '28px', fontWeight: '800' }}>Verify Account</h2>
            <p style={{ fontSize: '14px', color: '#e74c3c', textAlign: 'center', fontWeight: 'bold', margin: '0' }}>Your email is not verified!</p>
            <p style={{ fontSize: '13px', color: '#7f8c8d', textAlign: 'center', margin: '0 0 10px 0' }}>Please enter the 6-digit code sent to {unverifiedEmail}</p>
            
            <div>
              <input 
                type="text" placeholder="------" required 
                autoComplete="one-time-code"  
                maxLength="6"
                style={{...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold'}}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>
            <button type="submit" style={buttonStyle}>Verify & Login</button>
          </form>
        )}

      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', color: '#7f8c8d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease', outline: 'none', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '16px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', backgroundColor: '#d35400', transition: 'transform 0.2s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };

export default Login;