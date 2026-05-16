import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast'; 

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verification Code
  const [formData, setFormData] = useState({ username: '', email: '', password: '', adminKey: '' });
  const [verificationCode, setVerificationCode] = useState('');

  // --- STEP 1: SUBMIT DETAILS & SEND CODE ---
  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, email, password, adminKey } = formData;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address."); 
      return; 
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be 8+ characters and include uppercase, lowercase, a number, and a special character."); 
      return; 
    }

    try {
      const loadingToast = toast.loading("Sending verification code...");
      await axios.post('http://localhost:5001/api/register', { 
        username, email, password, adminCode: adminKey 
      });
      toast.dismiss(loadingToast);
      toast.success("Code sent! Check your email."); 
      setStep(2); // Move to Step 2
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong."); 
    }
  };

  // --- STEP 2: VERIFY THE OTP CODE ---
  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/verify-email', { 
        email: formData.email, 
        code: verificationCode 
      });
      toast.success("Account verified successfully! You can now log in.");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid verification code.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '80px', marginBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '380px', padding: '40px', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginTop: 0, marginBottom: '30px', fontSize: '28px', fontWeight: '800' }}>
          {step === 1 ? 'Create Account' : 'Verify Email'}
        </h2>
        
        {step === 1 ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input 
                type="text" placeholder="CoffeeLover99" required 
                style={inputStyle}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input 
                type="email" placeholder="hello@cinnamon.co" required 
                style={inputStyle}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input 
                type="password" placeholder="••••••••" required 
                style={inputStyle}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, color: '#bdc3c7' }}>Staff Key (Optional)</label>
              <input 
                type="text" placeholder="For admins only..." 
                style={{ ...inputStyle, border: '1px dashed #ced6e0' }}
                onChange={(e) => setFormData({...formData, adminKey: e.target.value})}
              />
            </div>
            <button type="submit" style={buttonStyle}>
              Create Account
            </button>
            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#7f8c8d' }}>
              Already have an account? <Link to="/login" style={{ color: '#d35400', textDecoration: 'none', fontWeight: 'bold' }}>Log in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '14px', color: '#27ae60', textAlign: 'center', fontWeight: 'bold', margin: '0 0 10px 0' }}>
              ✓ Code sent to {formData.email}
            </p>
            <div>
              <label style={{...labelStyle, textAlign: 'center'}}>Enter 6-Digit Code</label>
              <input 
                type="text" placeholder="------" required 
                autoComplete="one-time-code"  
                maxLength="6"
                style={{...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold'}}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>
            <button type="submit" style={buttonStyle}>
              Verify & Complete Signup
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Reusable clean styles
const labelStyle = { fontSize: '13px', color: '#7f8c8d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', marginTop: '8px', borderRadius: '8px', border: '1px solid #e0e6ed', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease' };
const buttonStyle = { width: '100%', padding: '14px', backgroundColor: '#d35400', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.2s ease', boxShadow: '0 4px 6px rgba(211, 84, 0, 0.2)' };

export default Signup;