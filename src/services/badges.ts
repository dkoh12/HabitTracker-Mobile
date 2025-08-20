import { apiClient, handleApiResponse, handleApiError } from './api';
import { BadgeResponse, ApiResponse } from '../types';

export const badgeService = {
  async getBadges(): Promise<ApiResponse<BadgeResponse | null>> {
    try {
      const response = await apiClient.get('/badges');
      return handleApiResponse<BadgeResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async awardBadge(badgeId: string): Promise<ApiResponse<any | null>> {
    try {
      const response = await apiClient.post('/badges', { badgeId });
      return handleApiResponse<any>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
};
