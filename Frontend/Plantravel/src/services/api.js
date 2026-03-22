import axios from 'axios';

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
      
      // If we aren't already on the login page, force a reload to kick them out
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;