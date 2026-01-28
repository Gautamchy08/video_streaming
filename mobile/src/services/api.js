import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API base URL - update this for your environment
// For Android emulator: http://10.0.2.2:5000
// For iOS simulator: http://localhost:5000
// For physical device: http://YOUR_COMPUTER_IP:5000
const API_URL = 'http://10.84.72.246:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Add JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken, 
          });

          const newToken = response.data.access_token;
          await SecureStore.setItemAsync('jwt_token', newToken);
          
          isRefreshing = false;
          onRefreshed(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear all tokens
        await SecureStore.deleteItemAsync('jwt_token');
        await SecureStore.deleteItemAsync('refresh_token');
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: (name, email, password) =>
    api.post('/auth/signup', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getProfile: () =>
    api.get('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// Video APIs
export const videoAPI = {
  getDashboard: (page = 1, limit = 2) =>
    api.get(`/dashboard?page=${page}&limit=${limit}`),

  getVideoStream: (videoId) =>
    api.get(`/video/${videoId}/stream`),
};

// Token management
export const tokenService = {
  saveTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync('jwt_token', accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync('refresh_token', refreshToken);
    }
  },

  saveToken: async (token) => {
    await SecureStore.setItemAsync('jwt_token', token);
  },

  getToken: async () => {
    return await SecureStore.getItemAsync('jwt_token');
  },

  getRefreshToken: async () => {
    return await SecureStore.getItemAsync('refresh_token');
  },

  removeTokens: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },

  removeToken: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
  },
};

export default api;
