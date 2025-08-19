import { apiClient, handleApiResponse, handleApiError } from './api';
import { LoginData, RegisterData, User, ApiResponse } from '../types';
import * as SecureStore from 'expo-secure-store';

export const authService = {
  async signIn(credentials: LoginData): Promise<ApiResponse<{ user: User; token: string } | null>> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const result = handleApiResponse<{ user: User; token: string }>(response);
      
      if (result.success && result.data?.token) {
        await SecureStore.setItemAsync('authToken', result.data.token);
      }
      
      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async signUp(credentials: RegisterData): Promise<ApiResponse<{ user: User; token: string } | null>> {
    try {
      const response = await apiClient.post('/auth/register', credentials);
      const result = handleApiResponse<{ user: User; token: string }>(response);
      
      if (result.success && result.data?.token) {
        await SecureStore.setItemAsync('authToken', result.data.token);
      }
      
      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async signOut(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authToken');
      // Optionally call logout endpoint
      // await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const response = await apiClient.get('/auth/me');
      return handleApiResponse<User>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  },
};
