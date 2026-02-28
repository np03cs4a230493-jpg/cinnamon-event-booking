import React from 'react';

function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={contentStyle}>
        <div>
          <h3 style={{ color: '#f1c40f', marginBottom: '10px' }}>Cinnamon & Co.</h3>
          <p style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>
            Brewing culture, community, and coffee since 2026.
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Contact Us</p>
          <p style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>hello@cinnamon.co</p>
          <p style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>+977 9800000000</p>
        </div>
      </div>
      
      <div style={copyrightStyle}>
        &copy; {new Date().getFullYear()} Cinnamon & Co. All rights reserved.
      </div>
    </footer>
  );
}

// Styles
const footerStyle = {
  backgroundColor: '#2c3e50',
  color: 'white',
  padding: '40px 20px 10px',
  marginTop: '60px',
  borderTop: '5px solid #d35400'
};

const contentStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '20px',
  paddingBottom: '20px'
};

const copyrightStyle = {
  textAlign: 'center',
  borderTop: '1px solid #34495e',
  paddingTop: '15px',
  fontSize: '0.8rem',
  color: '#7f8c8d'
};

export default Footer;