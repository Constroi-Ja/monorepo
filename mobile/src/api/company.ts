import { apiClient } from './client';
import { StoreItem, Deliverer, InventoryItem, Bill } from '@/types';

export const companyApi = {
  // Items CRUD
  getItems: (params?: { search?: string }) =>
    apiClient.get<StoreItem[]>('/items/', { params }),

  createItem: (data: FormData) => apiClient.post<StoreItem>('/items/', data),

  updateItem: (itemId: number, data: FormData | any) =>
    apiClient.patch<StoreItem>(`/items/${itemId}/`, data),

  deleteItem: (itemId: number) => apiClient.delete(`/items/${itemId}/`),

  // Deliverers
  getDeliverers: () => apiClient.get<Deliverer[]>('/deliverers/'),

  createDeliverer: (data: any) => apiClient.post<Deliverer>('/deliverers/', data),

  updateDeliverer: (id: number, data: any) =>
    apiClient.patch<Deliverer>(`/deliverers/${id}/`, data),

  deleteDeliverer: (id: number) => apiClient.delete(`/deliverers/${id}/`),

  // Inventory
  getInventory: () => apiClient.get<InventoryItem[]>('/inventory/'),

  createInventoryItem: (data: any) =>
    apiClient.post<InventoryItem>('/inventory/', data),

  updateInventoryItem: (id: number, data: any) =>
    apiClient.patch<InventoryItem>(`/inventory/${id}/`, data),

  deleteInventoryItem: (id: number) => apiClient.delete(`/inventory/${id}/`),

  // Bills
  getBills: (params?: { is_paid?: boolean; category?: string }) =>
    apiClient.get<Bill[]>('/core/bills/', { params }),

  createBill: (data: any) => apiClient.post<Bill>('/core/bills/', data),

  updateBill: (id: number, data: any) =>
    apiClient.patch<Bill>(`/core/bills/${id}/`, data),

  deleteBill: (id: number) => apiClient.delete(`/core/bills/${id}/`),
};
