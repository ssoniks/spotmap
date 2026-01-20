// src/composables/useAuth.js
import { ref, computed } from 'vue';
import { authApi } from '../services/api';

const user = ref(null);
const token = ref(localStorage.getItem('skate_token') || null);
const isAuthenticated = computed(() => !!token.value);

export function useAuth() {
  
  const login = async (email, password) => {
    try {
      const res = await authApi.post('/auth/login', { email, password });
      token.value = res.data.token;
      user.value = res.data.user;
      localStorage.setItem('skate_token', token.value);
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      await authApi.post('/auth/register', { username, email, password });
      return await login(email, password);
    } catch (err) {
      console.error('Registration failed', err);
      return false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('skate_token');
  };

  const checkAuth = async () => {
    if (!token.value) return;
    try {
      const res = await authApi.get('/auth/me');
      user.value = res.data.user; // Adjust based on actual API response structure
    } catch (e) {
      logout();
    }
  };

  return { user, token, isAuthenticated, login, register, logout, checkAuth };
}