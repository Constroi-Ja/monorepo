import { apiClient } from './client';

export const paymentsApi = {
  getStatus: (paymentId: number) =>
    apiClient.get<{ status: string }>(`/payments/${paymentId}/`),

  simulateApprove: (paymentId: number) =>
    apiClient.post(`/payments/${paymentId}/simulate-approve/`),
};
