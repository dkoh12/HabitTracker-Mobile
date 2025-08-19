import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '../types';

// Update this to your actual API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://habit-tracker-zeta-one.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('authToken');
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);

export const apiClient = api;

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
