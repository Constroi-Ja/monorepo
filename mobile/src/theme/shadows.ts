import { Platform } from 'react-native';

const shadow = (elevation: number, opacity: number, radius: number, offset: number) => ({
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: offset },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
  }),
});

export const Shadows = {
  xs: shadow(1, 0.04, 1, 1),
  sm: shadow(2, 0.06, 2, 1),
  md: shadow(4, 0.08, 4, 2),
  lg: shadow(8, 0.10, 8, 4),
  xl: shadow(16, 0.12, 16, 8),
} as const;
