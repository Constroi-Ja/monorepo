import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ApiError, ApiResponse, TokenRefreshResponse } from '@/types';

// Em dev, detecta automaticamente o IP do host via Metro bundler.
// Isso resolve o problema de "localhost" não funcionar em devices/emuladores Android.
function resolveApiUrl(): string {
  if (__DEV__) {
    const hostUri: string | undefined =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest2?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8000`;
      }
    }
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
}

export const API_URL = resolveApiUrl();

let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;
let onLogout: (() => void) | null = null;

export const setTokensInMemory = (access: string | null, refresh: string | null) => {
  accessTokenMemory = access;
  refreshTokenMemory = refresh;
};

export const setLogoutHandler = (handler: () => void) => {
  onLogout = handler;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (accessTokenMemory && config.headers) {
          config.headers.Authorization = `Bearer ${accessTokenMemory}`;
        }
        if (config.data instanceof FormData) {
          delete (config.headers as any)['Content-Type'];
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };
        const requestUrl = originalRequest?.url || '';
        const isAuthEndpoint =
          requestUrl.includes('/auth/login/') ||
          requestUrl.includes('/auth/register/') ||
          requestUrl.includes('/auth/token/refresh/');

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true;

          try {
            if (!refreshTokenMemory) throw new Error('No refresh token');

            const response = await axios.post<TokenRefreshResponse>(
              `${API_URL}/api/auth/token/refresh/`,
              { refresh: refreshTokenMemory }
            );

            const { access } = response.data;
            accessTokenMemory = access;
            await SecureStore.setItemAsync('access_token', access);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }

            return this.client(originalRequest);
          } catch {
            accessTokenMemory = null;
            refreshTokenMemory = null;
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            onLogout?.();
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const response = axiosError.response;

      if (response) {
        const errorData = response.data;

        if (errorData?.detail) return { error: { message: errorData.detail } };
        if (errorData?.error) return { error: { message: errorData.error } };

        if (errorData?.non_field_errors) {
          const msg = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : errorData.non_field_errors;
          return { error: { message: msg } };
        }

        if (typeof errorData === 'object' && errorData !== null) {
          const errors: Record<string, string[]> = {};
          Object.keys(errorData).forEach((key) => {
            const value = errorData[key];
            errors[key] = Array.isArray(value) ? value : [String(value)];
          });
          const firstKey = Object.keys(errors)[0];
          if (firstKey) {
            return { error: { message: errors[firstKey][0], errors } };
          }
        }

        return { error: { message: response.statusText || 'Erro ao processar requisição' } };
      }
    }

    return {
      error: {
        message:
          error instanceof Error ? error.message : 'Erro desconhecido',
      },
    };
  }
}

export const apiClient = new ApiClient();
