import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  googleAuth: () => `${API_URL}/auth/google`,
  githubAuth: () => `${API_URL}/auth/github`,
};

// Environments API
export const environmentsAPI = {
  getAll: () => api.get('/environments'),
  getOne: (id: string) => api.get(`/environments/${id}`),
  create: (data: { name: string; stack: string }) =>
    api.post('/environments', data),
  update: (id: string, data: Partial<{ name: string; status: string }>) =>
    api.put(`/environments/${id}`, data),
  delete: (id: string) => api.delete(`/environments/${id}`),
};

export default api;
