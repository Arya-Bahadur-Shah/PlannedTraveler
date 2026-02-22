import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = async (username, password) => {
  const res = await api.post('login/', { username, password }); 
  const userData = { 
    username: res.data.username, 
    role: res.data.role 
  };
  localStorage.setItem('access_token', res.data.access);
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);
};

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

const register = async (username, email, password) => {
  try {
    const res = await api.post('register/', { username, email, password });
    return res.data;
  } catch (err) {
    throw err.response.data;
  }
};

return (
  <AuthContext.Provider value={{ user, login, register, logout, loading }}>
    {children}
  </AuthContext.Provider>
);
};

export const useAuth = () => useContext(AuthContext);