import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '@/store/uiStore';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

const typeColors: Record<string, { bg: string; text: string }> = {
  success: { bg: Colors.success.dark, text: '#fff' },
  error: { bg: Colors.error.dark, text: '#fff' },
  info: { bg: Colors.neutral[800], text: '#fff' },
  warning: { bg: Colors.warning.dark, text: '#fff' },
};

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 12 }]}>
      {toasts.map((toast) => {
        const colors = typeColors[toast.type] ?? typeColors.info;
        return (
          <View key={toast.id} style={[styles.toast, { backgroundColor: colors.bg }]}>
            <Text style={[styles.text, { color: colors.text }]}>{toast.message}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing[4],
    right: Spacing[4],
    zIndex: 9999,
    gap: Spacing[2],
  },
  toast: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  text: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
  },
});
