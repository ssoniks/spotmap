// src/services/api.js
import axios from 'axios';

// Create instances for different services
const authApi = axios.create({ baseURL: 'http://localhost:4001' });
const spotApi = axios.create({ baseURL: 'http://localhost:4002' });
const mediaApi = axios.create({ baseURL: 'http://localhost:4003' });

// Helper to attach token
const attachToken = (config) => {
  const token = localStorage.getItem('skate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Interceptors
authApi.interceptors.request.use(attachToken);
spotApi.interceptors.request.use(attachToken);
mediaApi.interceptors.request.use(attachToken);

export { authApi, spotApi, mediaApi };
