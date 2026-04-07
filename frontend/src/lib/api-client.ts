import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import type { ApiError, ApiResponse, TokenRefreshResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get("access_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };
        const requestUrl = originalRequest?.url || "";
        const isAuthEndpoint =
          requestUrl.includes("/auth/login/") ||
          requestUrl.includes("/auth/register/") ||
          requestUrl.includes("/auth/token/refresh/");

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = Cookies.get("refresh_token");
            if (!refreshToken) {
              throw new Error("No refresh token");
            }

            const response = await axios.post<TokenRefreshResponse>(
              `${API_URL}/api/auth/token/refresh/`,
              { refresh: refreshToken } as { refresh: string }
            );

            const { access } = response.data;
            Cookies.set("access_token", access, { expires: 1 }); // 1 day

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
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
      const axiosError = error as AxiosError<{ detail?: string; error?: string; [key: string]: any }>;
      const response = axiosError.response;

      if (response) {
        const errorData = response.data;
        
        // Handle Django REST Framework error format
        if (errorData.detail) {
          return {
            error: {
              message: errorData.detail,
            },
          };
        }

        // Handle error field (from custom serializers)
        if (errorData.error) {
          return {
            error: {
              message: errorData.error,
            },
          };
        }

        // Handle field errors
        if (typeof errorData === "object") {
          const errors: Record<string, string[]> = {};
          Object.keys(errorData).forEach((key) => {
            const value = errorData[key];
            if (Array.isArray(value)) {
              errors[key] = value;
            } else if (typeof value === "string") {
              errors[key] = [value];
            }
          });

          if (Object.keys(errors).length > 0) {
            // Get first error message for display
            const firstErrorKey = Object.keys(errors)[0];
            const firstErrorMessage = Array.isArray(errors[firstErrorKey]) 
              ? errors[firstErrorKey][0] 
              : errors[firstErrorKey];
            
            return {
              error: {
                message: firstErrorMessage || "Validation error",
                errors,
              },
            };
          }
        }

        // Handle non_field_errors
        if (errorData.non_field_errors) {
          const nonFieldErrors = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors;
          return {
            error: {
              message: nonFieldErrors,
            },
          };
        }

        return {
          error: {
            message: response.statusText || "An error occurred",
          },
        };
      }
    }

    return {
      error: {
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
    };
  }
}

export const apiClient = new ApiClient();
