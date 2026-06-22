import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setAuthToken(parsed.token);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setInitializing(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setUser(res.data);
      setAuthToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { username, email, password });
      setUser(res.data);
      setAuthToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const loginWithGoogle = async (googleUser) => {
    try {
      const res = await api.post('/api/auth/google', {
        email: googleUser.email,
        username: googleUser.displayName,
        googleId: googleUser.uid
      });
      setUser(res.data);
      setAuthToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google Login failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    initializing,
    login,
    register,
    loginWithGoogle,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
