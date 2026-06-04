import { useThemeStore } from '@/store/themeStore';
import { lightTheme, darkTheme } from '@/theme/themes';

export function useTheme() {
  const { isDark, mode, toggleTheme } = useThemeStore();
  const colors = isDark ? darkTheme : lightTheme;
  return { isDark, mode, colors, toggleTheme };
}
