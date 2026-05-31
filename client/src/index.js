import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';

// Set the default backend URL for all Axios requests
// If REACT_APP_API_URL is available in environment variables,
// it will be used; otherwise localhost is used for development.
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create the root element where the React application will be mounted
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    { {/* Google OAuth Provider enables Google Sign-In throughout the application */}}
    <GoogleOAuthProvider clientId="936864795704-0b0qod9dau9912l81prptrstcdllmlgf.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);