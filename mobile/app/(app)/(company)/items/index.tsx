import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Image,
  Switch,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { companyApi } from '@/api/company';
import { StoreItem } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppIcon } from '@/components/shared/AppIcon';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/utils/currency';
import { useUiStore } from '@/store/uiStore';

export default function CompanyItemsScreen() {
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await companyApi.getItems();
    if (data) setItems(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (item: StoreItem) => {
    Alert.alert('Excluir produto', `Excluir "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await companyApi.deleteItem(item.id);
          addToast('Produto excluído.');
          await load();
        },
      },
    ]);
  };

  const handleToggle = async (item: StoreItem, value: boolean) => {
    await companyApi.updateItem(item.id, { is_available: value });
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: value } : i)));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Produtos</Text>
        <Pressable
          onPress={() => router.push('/(app)/(company)/items/new')}
          style={styles.fab}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : items.length === 0 ? (
        <EmptyState
          icon="package"
          title="Nenhum produto cadastrado"
          subtitle="Adicione produtos ao seu catálogo."
          ctaLabel="Adicionar produto"
          onCta={() => router.push('/(app)/(company)/items/new')}
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/(company)/items/${item.id}`)}
              style={styles.card}
            >
              <Image
                source={item.photo_url ? { uri: item.photo_url } : require('@/assets/placeholder-product.png')}
                style={styles.thumb}
              />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.brand}>{item.marca}</Text>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
              </View>
              <View style={styles.actions}>
                <Switch
                  value={item.is_available}
                  onValueChange={(v) => handleToggle(item, v)}
                  trackColor={{ false: Colors.neutral[200], true: Colors.brand[400] }}
                  thumbColor={item.is_available ? Colors.brand[500] : Colors.neutral[400]}
                />
                <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                  <AppIcon name="trash" size={20} color={Colors.error.base} />
                </Pressable>
              </View>
            </Pressable>
          )}
          estimatedItemSize={80}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing[4], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  fabText: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.neutral[0], lineHeight: 32 },
  list: { padding: Spacing.screenHorizontal, paddingBottom: Spacing.tabBarSafeBuffer, gap: Spacing[3] },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[3], flexDirection: 'row', alignItems: 'center', gap: Spacing[3], ...Shadows.sm },
  thumb: { width: 60, height: 60, borderRadius: Radius.md, backgroundColor: Colors.neutral[100] },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  brand: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.brand[500] },
  actions: { alignItems: 'center', gap: Spacing[2] },
  deleteIcon: { fontSize: 20 },
});
