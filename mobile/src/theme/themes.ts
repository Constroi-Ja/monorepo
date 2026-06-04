import { Colors } from './colors';

export const lightTheme = {
  background: Colors.surface.background,
  card: Colors.surface.card,
  text: Colors.neutral[900],
  textMuted: Colors.neutral[500],
  textInverse: Colors.neutral[0],
  border: Colors.neutral[200],
  input: Colors.neutral[0],
  inputBorder: Colors.neutral[200],
  tabBar: Colors.tabBar.bg,
  tabBorder: Colors.neutral[200],
  tabInactive: Colors.tabBar.inactive,
};

export const darkTheme = {
  background: Colors.neutral[900],
  card: Colors.neutral[800],
  text: Colors.neutral[50],
  textMuted: Colors.neutral[400],
  textInverse: Colors.neutral[900],
  border: Colors.neutral[700],
  input: Colors.neutral[700],
  inputBorder: Colors.neutral[600],
  tabBar: Colors.tabBar.bgDark,
  tabBorder: Colors.neutral[800],
  tabInactive: Colors.neutral[500],
};

export type AppTheme = typeof lightTheme;
