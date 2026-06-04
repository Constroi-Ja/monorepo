import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: 'light' | 'dark';
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  variant = 'light',
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const isDark = variant === 'dark';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>}
      <View
        style={[
          styles.container,
          isDark && styles.containerDark,
          focused && styles.containerFocused,
          error && styles.containerError,
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, isDark && styles.inputDark, leftIcon && styles.inputWithLeft, rightIcon && styles.inputWithRight, style]}
          placeholderTextColor={isDark ? Colors.neutral[500] : Colors.neutral[400]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          underlineColorAndroid="transparent"
          {...props}
        />
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.icon}
            hitSlop={8}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.neutral[700],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[3],
  },
  containerDark: {
    backgroundColor: Colors.neutral[700],
    borderColor: Colors.neutral[600],
  },
  containerFocused: { borderColor: Colors.brand[400] },
  containerError: { borderColor: Colors.error.base },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  inputDark: { color: Colors.neutral[50] },
  labelDark: { color: Colors.neutral[300] },
  inputWithLeft: { paddingLeft: 8 },
  inputWithRight: { paddingRight: 8 },
  icon: { justifyContent: 'center', alignItems: 'center', width: 24 },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.error.base,
  },
});
