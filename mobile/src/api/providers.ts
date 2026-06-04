import { apiClient } from './client';
import { Provider } from '@/types';

export const providersApi = {
  getNearby: (params?: { specialty?: string; search?: string }) =>
    apiClient.get<Provider[]>('/providers/nearby/', { params }),

  getById: (providerId: number) => apiClient.get<Provider>(`/providers/${providerId}/`),
};
