import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [mySuggestions, setMySuggestions] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1); // 1 = Profile, 2 = Verify Email OTP
  const [verificationCode, setVerificationCode] = useState('');
  const [editData, setEditData] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);
    setEditData({ username: storedUser.username, email: storedUser.email, password: '' });

    axios.get(`http://localhost:5001/api/bookings/user/${storedUser._id}`)
      .then(res => setBookings(res.data)).catch(err => console.error(err));

    axios.get(`http://localhost:5001/api/suggestions/user/${storedUser.email}`)
      .then(res => setMySuggestions(res.data)).catch(err => console.error(err));
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(editData.email)) {
      toast.error("Please enter a valid email address."); return; 
    }

    if (editData.password && editData.password.trim() !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(editData.password)) {
        toast.error("Password must be 8+ characters and include uppercase, lowercase, a number, and a special character."); return; 
      }
    }

    try {
      const loadingToast = toast.loading("Saving changes...");
      const response = await axios.put(`http://localhost:5001/api/users/${user._id}`, editData);
      toast.dismiss(loadingToast);

      if (response.data.emailChanged) {
        toast.success("Email changed! Please verify your new email.");
        setStep(2); // Switch to OTP Screen
      } else {
        localStorage.setItem('user', JSON.stringify(response.data));
        window.dispatchEvent(new Event("storage")); 
        setUser(response.data);
        setIsEditing(false);
        setEditData({ ...editData, password: '' });
        toast.success("Profile updated successfully!"); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile."); 
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/verify-email', { email: editData.email, code: verificationCode });
      
      // Update local storage with the new, verified user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event("storage")); 
      
      setUser(response.data.user);
      setStep(1); // Go back to normal profile view
      setIsEditing(false);
      setEditData({ ...editData, password: '' });
      toast.success("Email verified and profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid verification code.");
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h1 style={{ color: '#2c3e50', fontSize: '2.5rem', fontWeight: '800', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '30px' }}>
        My Profile
      </h1>
      
      <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '16px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem', fontWeight: '700' }}>
            {step === 2 ? '🔐 Verify New Email' : '👤 Account Details'}
          </h2>
          {!isEditing && step === 1 && (
            <button onClick={() => setIsEditing(true)} style={editBtnStyle}>✏️ Edit Profile</button>
          )}
        </div>

        {step === 2 ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: '#27ae60', fontWeight: 'bold', margin: '0' }}>✓ Verification code sent to {editData.email}</p>
            <div>
              <label style={labelStyle}>Enter 6-Digit Code</label>
              <input 
                type="text" placeholder="------" required 
                autoComplete="one-time-code"  
                maxLength="6"
                style={{...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold'}}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>
            <button type="submit" style={saveBtnStyle}>Verify Email</button>
          </form>
        ) : isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input type="text" value={editData.username} onChange={(e) => setEditData({...editData, username: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>New Password <span style={{color: '#bdc3c7', textTransform: 'none', fontWeight: '500'}}>(Leave blank to keep current)</span></label>
              <input type="password" autoComplete="new-password" placeholder="••••••••" value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button type="submit" style={saveBtnStyle}>💾 Save Changes</button>
              <button type="button" onClick={() => { setIsEditing(false); setEditData({ username: user.username, email: user.email, password: '' }); }} style={cancelBtnStyle}>✖ Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#555' }}><strong style={{ color: '#2c3e50' }}>Username:</strong> {user.username}</p>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#555' }}><strong style={{ color: '#2c3e50' }}>Email:</strong> {user.email}</p>
            <p style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              <strong style={{ color: '#2c3e50' }}>Account Type:</strong> 
              <span style={{ marginLeft: '12px', padding: '6px 14px', backgroundColor: user.role === 'admin' ? '#e74c3c' : '#3498db', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>
                {user.role.toUpperCase()}
              </span>
            </p>
          </div>
        )}
      </div>

      <h2 style={{ color: '#2c3e50', fontSize: '1.8rem', fontWeight: '800', marginBottom: '25px' }}>🎟️ My Tickets ({bookings.length})</h2>
      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>You haven't booked any events yet. Time to grab some coffee and enjoy a show!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {bookings.map(booking => (
            <div key={booking._id} style={{ borderLeft: '6px solid #d35400', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '700' }}>{booking.event?.title || 'Event no longer available'}</h3>
              <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '1.1rem' }}><strong style={{ color: '#2c3e50' }}>Tickets:</strong> {booking.quantity}</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#95a5a6', fontWeight: '500' }}>Booking ID: {booking._id}</p>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ color: '#2c3e50', fontSize: '1.8rem', fontWeight: '800', marginTop: '50px', marginBottom: '25px' }}>💡 My Event Ideas ({mySuggestions.length})</h2>
      {mySuggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>You haven't submitted any ideas yet. Have a cool event in mind?</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {mySuggestions.map(sugg => {
            let statusColor = '#f1c40f'; let statusText = 'PENDING REVIEW'; let bgColor = '#fcf9e8';
            if (sugg.status === 'accepted') { statusColor = '#27ae60'; statusText = 'ACCEPTED! 🎉'; bgColor = '#e8f8f5'; } 
            else if (sugg.status === 'declined') { statusColor = '#e74c3c'; statusText = 'NOT RIGHT NOW'; bgColor = '#fdedec'; }

            return (
              <div key={sugg._id} style={{ borderLeft: `6px solid ${statusColor}`, backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: '0', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '700' }}>{sugg.title}</h3>
                  <span style={{ backgroundColor: bgColor, color: statusColor, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>{statusText}</span>
                </div>
                <p style={{ margin: '0', color: '#555', fontSize: '1rem', lineHeight: '1.5' }}>"{sugg.description}"</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '13px', color: '#7f8c8d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #e0e6ed', fontSize: '15px', backgroundColor: '#f8f9fa', transition: 'border 0.2s ease', outline: 'none', boxSizing: 'border-box' };
const editBtnStyle = { backgroundColor: '#f8f9fa', border: '1px solid #e0e6ed', color: '#2c3e50', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s ease' };
const saveBtnStyle = { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', transition: 'background-color 0.2s ease', boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)' };
const cancelBtnStyle = { backgroundColor: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', transition: 'all 0.2s ease' };

export default Profile;