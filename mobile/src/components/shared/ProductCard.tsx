import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { StoreItem } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface ProductCardProps {
  item: StoreItem;
  onPress: () => void;
  onAdd: () => void;
}

export function ProductCard({ item, onPress, onAdd }: ProductCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image
        source={
          item.photo_url
            ? { uri: item.photo_url }
            : require('@/assets/placeholder-product.png')
        }
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.marca && (
          <Text style={styles.brand} numberOfLines={1}>
            {item.marca}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          <Pressable onPress={onAdd} style={styles.addButton} hitSlop={8}>
            <Text style={styles.addIcon}>+</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    overflow: 'hidden',
    margin: Spacing[1],
    ...Shadows.sm,
  },
  image: {
    width: '100%',
    height: 110,
    backgroundColor: Colors.neutral[100],
  },
  info: { padding: Spacing[2] },
  name: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.neutral[800],
    lineHeight: 18,
  },
  brand: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },
  price: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.brand[500],
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.neutral[0],
    lineHeight: 24,
  },
});
