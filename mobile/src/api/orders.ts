import { apiClient } from './client';
import { Order } from '@/types';

export const ordersApi = {
  getMyOrders: (params?: { status?: string; limit?: number }) =>
    apiClient.get<Order[]>('/orders/my/', { params }),

  getCompanyOrders: (params?: { status?: string; limit?: number }) =>
    apiClient.get<Order[]>('/orders/company/', { params }),

  getById: (orderId: number) => apiClient.get<Order>(`/orders/${orderId}/`),

  create: (data: any) => apiClient.post<any>('/orders/', data),

  updateStatus: (orderId: number, status: string) =>
    apiClient.patch(`/orders/${orderId}/status/`, { status }),

  getStats: (period: 'week' | 'month' | 'year') =>
    apiClient.get<any>('/orders/company/stats/', { params: { period } }),
};
