import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* --- NEW: WRAPPED APP IN GOOGLE PROVIDER --- */}
    <GoogleOAuthProvider clientId="YOUR_CLIENT_ID_HERE">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);