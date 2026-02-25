import Cookies from "js-cookie";
import { apiClient } from "./api-client";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "@/types";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login/",
      credentials
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    if (response.data) {
      this.setTokens(response.data.access, response.data.refresh);
      this.setUser(response.data.user);
    }

    return response.data!;
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register/", data);

    if (response.error) {
      const error: any = new Error(response.error.message);
      if (response.error.errors) {
        error.errors = response.error.errors;
      }
      throw error;
    }

    if (response.data) {
      // After registration, login automatically
      return this.login({
        email: data.email,
        password: data.password,
      });
    }

    return response.data!;
  },

  // Logout
  logout(): void {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(USER_KEY);
    
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const response = await apiClient.get<User>("/auth/me/");

    if (response.error || !response.data) {
      return null;
    }

    this.setUser(response.data);
    return response.data;
  },

  // Update profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>("/auth/me/update/", data);

    if (response.error) {
      throw new Error(response.error.message);
    }

    if (response.data) {
      this.setUser(response.data);
    }

    return response.data!;
  },

  // Token management
  setTokens(access: string, refresh: string): void {
    Cookies.set(TOKEN_KEY, access, { expires: 1 }); // 1 day
    Cookies.set(REFRESH_TOKEN_KEY, refresh, { expires: 7 }); // 7 days
  },

  getAccessToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  // User management
  setUser(user: User): void {
    Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7 });
  },

  getUser(): User | null {
    const userStr = Cookies.get(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },
};
