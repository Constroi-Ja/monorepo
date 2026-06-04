import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { storesApi } from '@/api/stores';
import { StoreCard } from '@/components/shared/StoreCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Store } from '@/types';

const CATEGORIES = ['Todos', 'Cimento', 'Tintas', 'Ferragens', 'Madeiras', 'Elétrica', 'Hidráulica'];

export default function StoresScreen() {
  const insets = useSafeAreaInsets();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');

  const load = useCallback(async () => {
    const { data } = await storesApi.getAll({
      search: search || undefined,
      category: category !== 'Todos' ? category : undefined,
    });
    if (data) setStores(data);
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Lojas e Materiais</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar lojas ou materiais..."
            placeholderTextColor={Colors.neutral[400]}
          />
        </View>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCategory(item)}
              style={[styles.chip, category === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        />
      </View>

      {loading ? (
        <LoadingScreen />
      ) : stores.length === 0 ? (
        <EmptyState
          icon="store"
          title="Nenhuma loja encontrada"
          subtitle="Tente buscar por outro termo ou categoria."
          ctaLabel="Limpar filtros"
          onCta={() => { setSearch(''); setCategory('Todos'); }}
        />
      ) : (
        <FlashList
          data={stores}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <StoreCard
              store={item}
              onPress={() => router.push(`/(app)/(consumer)/stores/${item.id}`)}
            />
          )}
          numColumns={2}
          estimatedItemSize={200}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand[500]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, gap: Spacing[3], paddingBottom: Spacing[3] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900], paddingTop: Spacing[2] },
  searchRow: {},
  searchInput: {
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[4],
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  chips: { gap: 8 },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[0],
  },
  chipActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  chipTextActive: { color: Colors.neutral[0] },
  list: { padding: Spacing[3], paddingBottom: Spacing.tabBarSafeBuffer },
});
