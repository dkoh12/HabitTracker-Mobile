import { apiClient, handleApiResponse, handleApiError } from './api';
import { Habit, HabitWithEntries, CreateHabitData, UpdateHabitData, HabitEntry, ApiResponse } from '../types';

export const habitService = {
  async getHabits(): Promise<ApiResponse<Habit[] | null>> {
    try {
      const response = await apiClient.get('/mobile/habits');
      return handleApiResponse<Habit[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getHabit(id: string): Promise<ApiResponse<HabitWithEntries | null>> {
    try {
      const response = await apiClient.get(`/mobile/habits/${id}`);
      return handleApiResponse<HabitWithEntries>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createHabit(data: CreateHabitData): Promise<ApiResponse<Habit | null>> {
    try {
      const response = await apiClient.post('/mobile/habits', data);
      return handleApiResponse<Habit>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateHabit(id: string, data: UpdateHabitData): Promise<ApiResponse<Habit | null>> {
    try {
      const response = await apiClient.put(`/mobile/habits/${id}`, data);
      return handleApiResponse<Habit>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async deleteHabit(id: string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete(`/mobile/habits/${id}`);
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async markHabitComplete(habitId: string, date: string): Promise<ApiResponse<HabitEntry | null>> {
    try {
      const response = await apiClient.post('/mobile/habit-entries', { 
        habitId, 
        date, 
        value: 1 
      });
      return handleApiResponse<HabitEntry>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async markHabitIncomplete(habitId: string, date: string): Promise<ApiResponse<null>> {
    try {
      // Find the entry first to get its ID
      const entriesResponse = await apiClient.get(`/mobile/habit-entries?habitId=${habitId}&startDate=${date}&endDate=${date}`);
      if (entriesResponse.data && entriesResponse.data.length > 0) {
        const entryId = entriesResponse.data[0].id;
        await apiClient.delete(`/mobile/habit-entries/${entryId}`);
      }
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getHabitEntries(habitId: string, startDate?: string, endDate?: string): Promise<ApiResponse<HabitEntry[] | null>> {
    try {
      const params = new URLSearchParams();
      params.append('habitId', habitId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/mobile/habit-entries?${params.toString()}`);
      return handleApiResponse<HabitEntry[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
