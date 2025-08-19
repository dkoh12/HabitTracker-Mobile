import { apiClient, handleApiResponse, handleApiError } from './api';
import { Habit, HabitWithEntries, CreateHabitData, UpdateHabitData, HabitEntry, ApiResponse } from '../types';

export const habitService = {
  async getHabits(): Promise<ApiResponse<Habit[] | null>> {
    try {
      const response = await apiClient.get('/habits');
      return handleApiResponse<Habit[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getHabit(id: string): Promise<ApiResponse<HabitWithEntries | null>> {
    try {
      const response = await apiClient.get(`/habits/${id}`);
      return handleApiResponse<HabitWithEntries>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createHabit(data: CreateHabitData): Promise<ApiResponse<Habit | null>> {
    try {
      const response = await apiClient.post('/habits', data);
      return handleApiResponse<Habit>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateHabit(id: string, data: UpdateHabitData): Promise<ApiResponse<Habit | null>> {
    try {
      const response = await apiClient.put(`/habits/${id}`, data);
      return handleApiResponse<Habit>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async deleteHabit(id: string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete(`/habits/${id}`);
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async markHabitComplete(habitId: string, date: string): Promise<ApiResponse<HabitEntry | null>> {
    try {
      const response = await apiClient.post(`/habits/${habitId}/entries`, { date, completed: true });
      return handleApiResponse<HabitEntry>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async markHabitIncomplete(habitId: string, date: string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete(`/habits/${habitId}/entries/${date}`);
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getHabitEntries(habitId: string, startDate?: string, endDate?: string): Promise<ApiResponse<HabitEntry[] | null>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/habits/${habitId}/entries?${params.toString()}`);
      return handleApiResponse<HabitEntry[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
