import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { Store } from '@/types';
import { isStoreOpen } from '@/utils/date';

interface StoreCardProps {
  store: Store;
  onPress: () => void;
  horizontal?: boolean;
}

export function StoreCard({ store, onPress, horizontal = false }: StoreCardProps) {
  const open = isStoreOpen(store.opening_time, store.closing_time);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, horizontal ? styles.horizontal : styles.vertical]}
    >
      <Image
        source={
          store.image_url
            ? { uri: store.image_url }
            : require('@/assets/placeholder-store.png')
        }
        style={[styles.image, horizontal ? styles.imageHorizontal : styles.imageVertical]}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {store.company_name}
          </Text>
          <View style={[styles.openBadge, !open && styles.closedBadge]}>
            <Text style={[styles.openText, !open && styles.closedText]}>
              {open ? 'Aberta' : 'Fechada'}
            </Text>
          </View>
        </View>
        <Text style={styles.category}>{store.category}</Text>
        <View style={styles.meta}>
          <Text style={styles.rating}>⭐ {store.rating.toFixed(1)}</Text>
          {store.distance > 0 && (
            <Text style={styles.distance}>• {store.distance.toFixed(1)} km</Text>
          )}
          {store.eta_minutes && (
            <Text style={styles.eta}>• {store.eta_minutes} min</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  horizontal: { width: 220, marginRight: Spacing[3] },
  vertical: { flex: 1, margin: Spacing[1] },
  image: { width: '100%', backgroundColor: Colors.neutral[100] },
  imageHorizontal: { height: 120 },
  imageVertical: { height: 100 },
  info: { padding: Spacing[3] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  name: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  openBadge: {
    backgroundColor: Colors.success.light,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closedBadge: { backgroundColor: Colors.error.light },
  openText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.success.dark,
  },
  closedText: { color: Colors.error.dark },
  category: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  meta: { flexDirection: 'row', gap: 4, marginTop: 4 },
  rating: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.neutral[700] },
  distance: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  eta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
});
