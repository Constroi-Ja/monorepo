import { apiClient } from './client';
import { AuthResponse, User } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login/', { email, password }),

  registerConsumer: (data: any) =>
    apiClient.post<AuthResponse>('/auth/register/consumer/', data),

  registerProvider: (data: FormData) =>
    apiClient.post<AuthResponse>('/auth/register/provider/', data),

  registerCompany: (data: any) =>
    apiClient.post<AuthResponse>('/auth/register/company/', data),

  me: () => apiClient.get<User>('/auth/me/'),

  updateProfile: (data: FormData | any) =>
    apiClient.put<User>('/auth/me/update/', data),

  updateConsumerProfile: (data: any) =>
    apiClient.put<User>('/auth/profile/consumer/', data),

  updateProviderProfile: (data: FormData | any) =>
    apiClient.put<User>('/auth/profile/provider/', data),

  updateCompanyProfile: (data: FormData | any) =>
    apiClient.put<User>('/auth/profile/company/', data),

  confirmEmail: (token: string) =>
    apiClient.post('/auth/confirm-email/', { token }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/password-reset/', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/password-reset/confirm/', { token, password }),

  updateAvailability: (is_available: boolean) =>
    apiClient.post('/auth/providers/availability/update/', { is_available }),

  verifyProvider: (providerId: number) =>
    apiClient.post(`/auth/admin/providers/${providerId}/verify/`),
};
