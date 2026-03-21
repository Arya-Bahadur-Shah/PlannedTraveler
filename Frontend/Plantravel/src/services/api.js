import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// 1. REQUEST INTERCEPTOR: Attach token only if it's valid
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); 
  
  // Check if token exists and isn't just a string like "null" or "undefined"
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
    // If we get a 401, the token in storage is dead. 
    // We should clear it so the app stops sending a broken token.
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid token. Clearing credentials...");
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Optional: Redirect to login if they aren't on a public page
      // if (!window.location.pathname.includes('/blogs')) {
      //    window.location.href = '/login';
      // }
    }
    return Promise.reject(error);
  }
);

export default api;