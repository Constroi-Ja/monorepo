import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

type InfoBoxType = 'info' | 'success' | 'warning' | 'error';

interface InfoBoxProps {
  type?: InfoBoxType;
  title?: string;
  message: string;
  style?: ViewStyle;
}

const config: Record<InfoBoxType, { bg: string; border: string; text: string }> = {
  info: { bg: Colors.info.light, border: Colors.info.base, text: Colors.info.dark },
  success: { bg: Colors.success.light, border: Colors.success.base, text: Colors.success.dark },
  warning: { bg: Colors.warning.light, border: Colors.warning.base, text: Colors.warning.dark },
  error: { bg: Colors.error.light, border: Colors.error.base, text: Colors.error.dark },
};

export function InfoBox({ type = 'info', title, message, style }: InfoBoxProps) {
  const { bg, border, text } = config[type];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg, borderLeftColor: border },
        style,
      ]}
    >
      {title && <Text style={[styles.title, { color: text }]}>{title}</Text>}
      <Text style={[styles.message, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: 4,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
