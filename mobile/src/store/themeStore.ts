import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'app_theme';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,

  loadTheme: async () => {
    const saved = await SecureStore.getItemAsync(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      set({ mode: saved, isDark: saved === 'dark' });
    }
  },

  toggleTheme: async () => {
    const next: ThemeMode = get().mode === 'light' ? 'dark' : 'light';
    await SecureStore.setItemAsync(THEME_KEY, next);
    set({ mode: next, isDark: next === 'dark' });
  },
}));
