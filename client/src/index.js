import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* --- NEW: WRAPPED APP IN GOOGLE PROVIDER --- */}
    <GoogleOAuthProvider clientId="936864795704-0b0qod9dau9912l81prptrstcdllmlgf.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);