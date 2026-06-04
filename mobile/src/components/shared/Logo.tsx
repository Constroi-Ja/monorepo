import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/theme';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  variant?: 'full' | 'icon';
  dark?: boolean;
}

export function Logo({ size = 'md', variant = 'full', dark = false }: LogoProps) {
  const blockSize = { sm: 24, md: 32, lg: 48 }[size];
  const fontSize = { sm: 16, md: 22, lg: 32 }[size];
  const textColor = dark ? Colors.neutral[0] : Colors.neutral[900];

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { width: blockSize, height: blockSize }]}>
        <View style={[styles.block, styles.blockTL, { width: blockSize * 0.45, height: blockSize * 0.45 }]} />
        <View style={[styles.block, styles.blockBR, { width: blockSize * 0.45, height: blockSize * 0.45 }]} />
      </View>
      {variant === 'full' && (
        <Text style={[styles.wordmark, { fontSize, color: textColor }]}>
          Constrói<Text style={styles.accent}>Já</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  block: {
    position: 'absolute',
    borderRadius: 3,
    backgroundColor: Colors.brand[500],
  },
  blockTL: { top: 0, left: 0 },
  blockBR: {
    bottom: 0,
    right: 0,
    backgroundColor: Colors.brand[700],
  },
  wordmark: {
    fontFamily: FontFamily.bold,
  },
  accent: { color: Colors.brand[500] },
});
