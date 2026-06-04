import { apiClient } from './client';
import { User, Provider, Store, Review, AdminStats } from '@/types';

export const adminApi = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats/'),

  getUsers: (params?: { search?: string; user_type?: string }) =>
    apiClient.get<User[]>('/admin/users/', { params }),

  getProviders: (params?: { verified?: boolean }) =>
    apiClient.get<Provider[]>('/admin/providers/', { params }),

  getStores: () => apiClient.get<Store[]>('/admin/stores/'),

  getReviews: (params?: { target_type?: string; min_rating?: number }) =>
    apiClient.get<Review[]>('/admin/reviews/', { params }),

  createReview: (data: any) => apiClient.post('/reviews/', data),
};
