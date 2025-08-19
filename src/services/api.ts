import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '../types';

// Update this to your actual API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://habit-tracker-zeta-one.vercel.app/api';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored token
      try {
        await SecureStore.deleteItemAsync('authToken');
      } catch (deleteError) {
        console.error('Error clearing auth token:', deleteError);
      }
      console.log('Token expired, user needs to login again');
    }
    return Promise.reject(error);
  }
);

export { apiClient };

// Helper function to handle API responses
export const handleApiResponse = <T>(response: any): ApiResponse<T> => {
  if (response.data) {
    return {
      success: true,
      data: response.data,
    };
  }
  return {
    success: false,
    error: 'No data received',
  };
};

// Helper function to handle API errors
export const handleApiError = (error: any): ApiResponse<null> => {
  console.error('API Error:', error);
  console.error('Error Response:', error.response);
  console.error('Error Status:', error.response?.status);
  console.error('Error Data:', error.response?.data);
  console.error('Request URL:', error.config?.url);
  console.error('Request Data:', error.config?.data);
  
  if (error.response?.data?.message) {
    return {
      success: false,
      error: error.response.data.message,
    };
  }
  
  if (error.message) {
    return {
      success: false,
      error: error.message,
    };
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
  };
};
