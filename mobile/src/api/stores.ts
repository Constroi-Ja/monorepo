import { apiClient } from './client';
import { Store, StoreItem, Review } from '@/types';

export const storesApi = {
  getFeatured: () => apiClient.get<Store[]>('/stores/featured/'),

  getAll: (params?: { search?: string; category?: string; ordering?: string }) =>
    apiClient.get<Store[]>('/stores/', { params }),

  getById: (storeId: number) => apiClient.get<Store>(`/stores/${storeId}/`),

  getItems: (params?: { company_id?: number; search?: string; category?: string }) =>
    apiClient.get<StoreItem[]>('/items/public/', { params }),

  getReviews: (storeId: number) =>
    apiClient.get<Review[]>(`/stores/${storeId}/reviews/`),
};
