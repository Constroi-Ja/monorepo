import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const labelStyle = [styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={containerStyle}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? Colors.neutral[0] : Colors.brand[500]}
            size="small"
          />
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },

  primary: { backgroundColor: Colors.brand[500] },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.brand[500],
  },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: Colors.error.base },

  size_sm: { height: 36, paddingHorizontal: Spacing[3] },
  size_md: { height: 48, paddingHorizontal: Spacing[4] },
  size_lg: { height: 56, paddingHorizontal: Spacing[5] },

  label: { fontFamily: FontFamily.semiBold, textAlign: 'center' },
  label_primary: { color: Colors.neutral[0] },
  label_outline: { color: Colors.brand[500] },
  label_ghost: { color: Colors.brand[500] },
  label_destructive: { color: Colors.neutral[0] },

  labelSize_sm: { fontSize: FontSize.sm },
  labelSize_md: { fontSize: FontSize.base },
  labelSize_lg: { fontSize: FontSize.md },
});
