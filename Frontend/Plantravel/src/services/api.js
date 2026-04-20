/**
 * @file api.js
 * @description Central Axios instance for all API calls in PlannedTraveler.
 *
 * Configured with:
 * - baseURL pointing to the Django REST backend (http://127.0.0.1:8000/api/)
 * - REQUEST interceptor: Attaches the stored JWT Bearer token to every request.
 *   Safely guards against storing literal "undefined" or "null" strings.
 * - RESPONSE interceptor: Automatically clears auth state and redirects to /login
 *   when the backend returns a 401 Unauthorized (expired or invalid token).
 *
 * Usage: `import api from '../services/api';`
 */

import axios from 'axios';

/** Preconfigured Axios instance pointed at the backend API root */
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// 1. REQUEST INTERCEPTOR: Attach token only if it's valid
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); 
  
  // Safety check: Prevent React from sending literal "undefined" or "null" as strings
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. RESPONSE INTERCEPTOR: Handle expired tokens automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend says the token is dead (401), we clean up the frontend
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid token. Clearing credentials...");
      
      // Clear storage so the app knows the user is logged out
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Tell React explicitly that auth is gone
      window.dispatchEvent(new Event('auth_declined'));
      
      // Define public routes that do not require forced login redirection
      const publicRoutes = ['/', '/login', '/register', '/blogs', '/forgot-password'];
      const isPublic = publicRoutes.includes(window.location.pathname) || window.location.pathname.startsWith('/share/');

      // If they are not on a public page, force them to login
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;