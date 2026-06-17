import axios from 'axios';

const API_URL = 'https://localhost:7080/api';

const api = axios.create({
  baseURL: API_URL,
});

// Automatically add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// USER
export const register = (data) => api.post('/User/register', data);
export const login = (data) => api.post('/User/login', data);
export const getProfile = () => api.get('/User/profile');

export default api;