import { apiClient } from './client';
import { CartItem } from '@/types';

export const cartApi = {
  getCart: () => apiClient.get<CartItem[]>('/cart/'),

  addItem: (itemId: number, quantity: number) =>
    apiClient.post('/cart/', { item: itemId, quantity }),

  updateItem: (cartItemId: number, quantity: number) =>
    apiClient.patch(`/cart/${cartItemId}/`, { quantity }),

  removeItem: (cartItemId: number) => apiClient.delete(`/cart/${cartItemId}/`),

  getShippingEstimate: (cep: string) =>
    apiClient.get<any>('/cart/shipping-estimate/', { params: { cep } }),

  applyCoupon: (code: string) => apiClient.post('/cart/coupon/', { code }),
};
