import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { Provider } from '@/types';

interface ProviderCardProps {
  provider: Provider;
  onPress: () => void;
}

export function ProviderCard({ provider, onPress }: ProviderCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image
        source={
          provider.image_url
            ? { uri: provider.image_url }
            : require('@/assets/placeholder-avatar.png')
        }
        style={styles.avatar}
        resizeMode="cover"
      />
      <View style={styles.availableDot(provider.is_available)} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {provider.full_name}
        </Text>
        <Text style={styles.specialty} numberOfLines={1}>
          {provider.specialties.slice(0, 2).join(' • ')}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.rating}>⭐ {provider.rating.toFixed(1)}</Text>
          {provider.distance > 0 && (
            <Text style={styles.distance}>{provider.distance.toFixed(1)} km</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = {
  card: {
    width: 140,
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    overflow: 'hidden' as const,
    marginRight: Spacing[3],
    ...Shadows.md,
  },
  avatar: {
    width: '100%' as const,
    height: 100,
    backgroundColor: Colors.neutral[100],
  },
  availableDot: (available?: boolean) =>
    StyleSheet.flatten([
      {
        position: 'absolute' as const,
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.neutral[0],
        backgroundColor: available ? Colors.success.base : Colors.neutral[300],
      },
    ]),
  info: { padding: Spacing[2] },
  name: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.neutral[900],
  },
  specialty: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.neutral[500],
    marginTop: 1,
  },
  meta: { flexDirection: 'row' as const, gap: 6, marginTop: 4 },
  rating: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.neutral[700],
  },
  distance: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.neutral[500],
  },
};
