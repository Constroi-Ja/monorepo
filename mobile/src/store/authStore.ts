import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthResponse } from '@/types';
import { authApi } from '@/api/auth';
import { setTokensInMemory, setLogoutHandler } from '@/api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const access = await SecureStore.getItemAsync('access_token');
      const refresh = await SecureStore.getItemAsync('refresh_token');

      if (access && refresh) {
        setTokensInMemory(access, refresh);
        set({ accessToken: access, refreshToken: refresh });

        const { data: user } = await authApi.me();
        if (user) set({ user });
      }
    } catch {
      // tokens expired or invalid
    } finally {
      set({ isHydrated: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await authApi.login(email, password);
      if (error) throw new Error(error.message);

      const { access, refresh, user } = data as AuthResponse;

      await SecureStore.setItemAsync('access_token', access);
      await SecureStore.setItemAsync('refresh_token', refresh);
      setTokensInMemory(access, refresh);

      set({ user, accessToken: access, refreshToken: refresh });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setTokensInMemory(null, null);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  refreshUser: async () => {
    const { data: user } = await authApi.me();
    if (user) set({ user });
  },

  setUser: (user: User) => set({ user }),
}));

// Register logout handler with API client
setLogoutHandler(async () => {
  const store = useAuthStore.getState();
  await store.logout();
});
