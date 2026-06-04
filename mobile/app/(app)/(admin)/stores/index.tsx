import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { adminApi } from '@/api/admin';
import { Store } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function AdminStoresScreen() {
  const insets = useSafeAreaInsets();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { const { data } = await adminApi.getStores(); if (data) setStores(data); };
  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Lojas</Text>

      {loading ? <LoadingScreen /> : stores.length === 0 ? (
        <EmptyState icon="store" title="Nenhuma loja" subtitle="Não há lojas cadastradas." />
      ) : (
        <FlashList
          data={stores}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image source={item.image_url ? { uri: item.image_url } : require('@/assets/placeholder-store.png')} style={styles.logo} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.company_name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.rating}>{Number(item.rating).toFixed(1)}</Text>
              </View>
            </View>
          )}
          estimatedItemSize={72}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[900] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0], padding: Spacing.screenHorizontal },
  list: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[10] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.neutral[800] },
  logo: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.neutral[700] },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[0] },
  category: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[400] },
  rating: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
});
