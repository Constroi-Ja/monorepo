import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  const width = useRef(new Animated.Value(0)).current;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((_, i) => (
          <View key={i} style={styles.stepWrapper}>
            <View
              style={[
                styles.circle,
                i <= currentStep && styles.circleActive,
                i < currentStep && styles.circleCompleted,
              ]}
            >
              <Text
                style={[
                  styles.circleText,
                  i <= currentStep && styles.circleTextActive,
                ]}
              >
                {i < currentStep ? '✓' : String(i + 1)}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View
                style={[styles.connector, i < currentStep && styles.connectorActive]}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.bar}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: width.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.label}>{steps[currentStep]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing[2] },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { borderColor: Colors.brand[500] },
  circleCompleted: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  circleText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.neutral[400],
  },
  circleTextActive: { color: Colors.neutral[0] },
  connector: { width: 24, height: 2, backgroundColor: Colors.neutral[200] },
  connectorActive: { backgroundColor: Colors.brand[500] },
  bar: {
    height: 4,
    backgroundColor: Colors.neutral[200],
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.brand[500],
    borderRadius: Radius.full,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
});
