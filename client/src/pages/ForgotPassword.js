import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function ForgotPassword() {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/forgot-password', { email });
      toast.success("Reset code sent to your email!");
      setStep(2); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending code");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reset-password', { email, code, newPassword });
      toast.success("Password reset successfully! You can now log in.");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired code");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '80px', marginBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '380px', padding: '40px', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginTop: 0, marginBottom: '10px', fontSize: '26px', fontWeight: '800' }}>
          Reset Password
        </h2>
        
        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <p style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '30px', textAlign: 'center', lineHeight: '1.5' }}>
              Enter your email address and we'll send you a 6-digit reset code.
            </p>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
              <input 
                type="email" placeholder="hello@cinnamon.co" required 
                style={inputStyle}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" style={buttonStyle}>Send Recovery Code</button>
            <div style={{ textAlign: 'center', marginTop: '25px' }}>
               <Link to="/login" style={{ fontSize: '14px', color: '#95a5a6', textDecoration: 'none', fontWeight: '600' }}>&larr; Back to Login</Link>
            </div>
          </form>
        ) : (
    <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: '14px', color: '#27ae60', marginBottom: '25px', textAlign: 'center', fontWeight: 'bold' }}>
              ✓ Code sent! Check your inbox.
            </p>

            {/* --- FIX: Hidden "Honeypot" input to catch the aggressive browser autofill! --- */}
            <input type="email" autoComplete="username" value={email} readOnly style={{ display: 'none' }} />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>6-Digit Code</label>
              <input 
                type="text" 
                name="otp-code"
                inputMode="numeric" /* Tells mobile phones to open the number keypad */
                pattern="[0-9]*" 
                placeholder="------" 
                required 
                autoComplete="one-time-code"
                maxLength="6"
                style={{...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold'}}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Password</label>
              <input 
                type="password" 
                autoComplete="new-password" /* Explicitly tells the browser this is a NEW password */
                placeholder="••••••••" 
                required 
                style={inputStyle}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button type="submit" style={buttonStyle}>Update Password</button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '14px', marginTop: '8px', borderRadius: '8px', border: '1px solid #e0e6ed', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease' };
const buttonStyle = { width: '100%', padding: '14px', backgroundColor: '#d35400', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.2s ease', boxShadow: '0 4px 6px rgba(211, 84, 0, 0.2)' };

export default ForgotPassword;