import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) setUser({ loggedIn: true });
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('http://127.0.0.1:8000/api/login/', { username, password });
    localStorage.setItem('access_token', res.data.access);
    setUser({ loggedIn: true });
    return res.data;
  };

  const register = async (userData) => {
    return await axios.post('http://127.0.0.1:8000/api/register/', userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);