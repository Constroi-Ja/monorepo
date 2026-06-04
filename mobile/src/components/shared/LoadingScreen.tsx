import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '@/theme';
import { Logo } from './Logo';

export function LoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Logo size="lg" />
      </Animated.View>
      <ActivityIndicator
        color={Colors.brand[500]}
        size="large"
        style={{ marginTop: Spacing[6] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
