import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ForgotPassword() {
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: Code & New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/forgot-password', { email });
      toast.success("Reset code sent to your email!");
      setStep(2); // Move to the next step!
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending code");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/reset-password', { email, code, newPassword });
      toast.success("Password reset successfully! You can now log in.");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired code");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <div style={{ width: '320px', padding: '30px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', color: '#d35400', marginTop: 0 }}>Reset Password</h2>
        
        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <p style={{ fontSize: '14px', color: '#777', marginBottom: '20px', textAlign: 'center' }}>
              Enter your email address and we'll send you a 6-digit reset code.
            </p>
            <input 
              type="email" placeholder="Enter your email" required 
              style={inputStyle}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" style={buttonStyle}>Send Code</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: '14px', color: '#27ae60', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
              Code sent! Check your inbox.
            </p>
            <input 
              type="text" placeholder="6-Digit Code" required 
              style={{...inputStyle, letterSpacing: '3px', textAlign: 'center', fontWeight: 'bold'}}
              onChange={(e) => setCode(e.target.value)}
            />
            <input 
              type="password" placeholder="New Password" required 
              style={inputStyle}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="submit" style={buttonStyle}>Update Password</button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#d35400', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default ForgotPassword;