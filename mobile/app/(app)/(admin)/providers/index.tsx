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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { adminApi } from '@/api/admin';
import { authApi } from '@/api/auth';
import { Provider } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { useUiStore } from '@/store/uiStore';

type Filter = 'all' | 'pending' | 'verified';

export default function AdminProvidersScreen() {
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('pending');

  const load = useCallback(async () => {
    const params = filter === 'pending' ? { verified: false } : filter === 'verified' ? { verified: true } : undefined;
    const { data } = await adminApi.getProviders(params);
    if (data) setProviders(data);
  }, [filter]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [filter]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleVerify = (provider: Provider) => {
    Alert.alert('Verificar prestador', `Verificar ${provider.full_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Verificar',
        onPress: async () => {
          const { error } = await authApi.verifyProvider(provider.id);
          if (error) { addToast(error.message, 'error'); }
          else { addToast('Prestador verificado!'); await load(); }
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Prestadores</Text>
        <View style={styles.filters}>
          {(['all', 'pending', 'verified'] as Filter[]).map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Verificados'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? <LoadingScreen /> : providers.length === 0 ? (
        <EmptyState icon="hammer" title="Nenhum prestador encontrado" subtitle="Ajuste os filtros." />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={item.image_url ? { uri: item.image_url } : require('@/assets/placeholder-avatar.png')} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.specialties} numberOfLines={1}>{item.specialties.join(', ')}</Text>
                <Text style={styles.rating}>{Number(item.rating).toFixed(1)} • {Number(item.distance).toFixed(1)} km</Text>
              </View>
              {!item.verified && (
                <Pressable onPress={() => handleVerify(item)} style={styles.verifyBtn}>
                  <Text style={styles.verifyText}>Verificar</Text>
                </Pressable>
              )}
              {item.verified && <StatusBadge status="verified" />}
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[900] },
  header: { padding: Spacing.screenHorizontal, gap: Spacing[3] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0] },
  filters: { flexDirection: 'row', backgroundColor: Colors.neutral[800], borderRadius: Radius.lg, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  filterBtnActive: { backgroundColor: Colors.neutral[700] },
  filterText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
  filterTextActive: { color: Colors.neutral[0] },
  list: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[10], gap: Spacing[3] },
  card: { backgroundColor: Colors.neutral[800], borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.neutral[700] },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[0] },
  specialties: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[400] },
  rating: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  verifyBtn: { backgroundColor: Colors.brand[500], borderRadius: Radius.lg, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  verifyText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.neutral[0] },
});
