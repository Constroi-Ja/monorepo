import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { cartApi } from '@/api/cart';
import { CartItem } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const setCount = useCartStore((s) => s.setCount);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await cartApi.getCart();
    if (data) {
      setItems(data);
      setCount(data.reduce((acc, i) => acc + i.quantity, 0));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const updateQty = async (item: CartItem, qty: number) => {
    if (qty <= 0) {
      Alert.alert('Remover item', `Remover ${item.item.name} do carrinho?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await cartApi.removeItem(item.id);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await load();
          },
        },
      ]);
      return;
    }
    await cartApi.updateItem(item.id, qty);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity: qty } : i)));
    setCount(items.reduce((acc, i) => acc + (i.id === item.id ? qty : i.quantity), 0));
  };

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Carrinho</Text>
        <Text style={styles.count}>
          {items.reduce((acc, i) => acc + i.quantity, 0)} item(s)
        </Text>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="shopping-cart"
          title="Carrinho vazio"
          subtitle="Adicione produtos de nossas lojas."
          ctaLabel="Ver materiais"
          onCta={() => router.push('/(app)/(consumer)/stores/index')}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <Image
                  source={
                    item.item.photo_url
                      ? { uri: item.item.photo_url }
                      : require('@/assets/placeholder-product.png')
                  }
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.item.name}</Text>
                  <Text style={styles.itemStore}>{item.item.company_name}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(String(item.total))}</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => updateQty(item, item.quantity - 1)}
                    style={styles.stepperBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.stepperIcon}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperQty}>{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateQty(item, item.quantity + 1)}
                    style={styles.stepperBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.stepperIcon}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.brand[500]}
              />
            }
            ListFooterComponent={
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Frete</Text>
                  <Text style={styles.summaryValue}>A calcular</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total estimado</Text>
                  <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                </View>
              </View>
            }
          />

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.footerTotal}>
              <Text style={styles.footerTotalLabel}>Total</Text>
              <Text style={styles.footerTotalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <Button
              onPress={() => router.push('/(app)/(consumer)/cart/checkout')}
              label="Finalizar pedido"
              size="lg"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  count: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  list: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[4], gap: Spacing[3] },
  itemCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[3],
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'center',
    ...Shadows.sm,
  },
  itemImage: { width: 70, height: 70, borderRadius: Radius.md, backgroundColor: Colors.neutral[100] },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.neutral[900] },
  itemStore: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  itemPrice: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.brand[500] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperIcon: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.neutral[700], lineHeight: 22 },
  stepperQty: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900], minWidth: 20, textAlign: 'center' },
  summary: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[500] },
  summaryValue: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.neutral[700] },
  totalRow: { paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.neutral[100] },
  totalLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[900] },
  totalValue: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.brand[500] },
  footer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    gap: Spacing[3],
  },
  footerTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTotalLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[500] },
  footerTotalValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.brand[500] },
});
