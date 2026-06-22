import axios from 'axios';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Read from in-memory token to avoid cross-tab token leaking
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    } else {
      // Fallback on initial load
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
        authToken = user.token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
