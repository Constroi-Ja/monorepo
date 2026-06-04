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
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { providersApi } from '@/api/providers';
import { Provider } from '@/types';
import { ProviderCard } from '@/components/shared/ProviderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

const SPECIALTIES = ['Todos', 'Elétrica', 'Hidráulica', 'Alvenaria', 'Pintura', 'Carpintaria', 'Serralheria'];

export default function ProvidersScreen() {
  const insets = useSafeAreaInsets();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('Todos');

  const load = useCallback(async () => {
    const { data } = await providersApi.getNearby({
      specialty: specialty !== 'Todos' ? specialty : undefined,
      search: search || undefined,
    });
    if (data) setProviders(data);
  }, [search, specialty]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, specialty]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Prestadores</Text>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome..."
          placeholderTextColor={Colors.neutral[400]}
        />
        <FlatList
          data={SPECIALTIES}
          keyExtractor={(i) => i}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSpecialty(item)}
              style={[styles.chip, specialty === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, specialty === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        />
      </View>

      {loading ? (
        <LoadingScreen />
      ) : providers.length === 0 ? (
        <EmptyState icon="hammer" title="Nenhum prestador encontrado" subtitle="Tente outra especialidade ou termo de busca." />
      ) : (
        <FlashList
          data={providers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProviderCard provider={item} onPress={() => {}} />
          )}
          estimatedItemSize={90}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, gap: Spacing[3], paddingVertical: Spacing[4] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  search: { height: 52, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[0], paddingHorizontal: Spacing[4], fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[900] },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[0] },
  chipActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  chipTextActive: { color: Colors.neutral[0] },
  list: { padding: Spacing[3], paddingBottom: Spacing.tabBarSafeBuffer },
});
