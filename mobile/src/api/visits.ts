import { apiClient } from './client';
import { TechnicalVisitRequest, VisitMessage, CreateVisitResponse } from '@/types';

export const visitsApi = {
  getMyVisits: (params?: { status?: string; limit?: number }) =>
    apiClient.get<TechnicalVisitRequest[]>('/technical-visits/my/', { params }),

  getById: (visitId: number) =>
    apiClient.get<TechnicalVisitRequest>(`/technical-visits/${visitId}/`),

  create: (data: any) => apiClient.post<CreateVisitResponse>('/technical-visits/', data),

  update: (visitId: number, data: any) =>
    apiClient.patch<TechnicalVisitRequest>(`/technical-visits/${visitId}/`, data),

  cancel: (visitId: number) =>
    apiClient.post(`/technical-visits/${visitId}/cancel/`),

  complete: (visitId: number) =>
    apiClient.post(`/technical-visits/${visitId}/complete/`),

  getMessages: (visitId: number) =>
    apiClient.get<VisitMessage[]>(`/technical-visits/${visitId}/messages/`),

  sendMessage: (visitId: number, content: string) =>
    apiClient.post<VisitMessage>(`/technical-visits/${visitId}/messages/`, { content }),
};
