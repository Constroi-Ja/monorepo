import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { visitsApi } from '@/api/visits';
import { TechnicalVisitRequest } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { formatDateOnly } from '@/utils/date';

const statusColors: Record<string, string> = {
  pending: Colors.info.base,
  accepted: Colors.brand[500],
  completed: Colors.success.base,
  cancelled: Colors.error.base,
  refused: Colors.error.base,
};

export default function VisitsScreen() {
  const insets = useSafeAreaInsets();
  const [visits, setVisits] = useState<TechnicalVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await visitsApi.getMyVisits();
    if (data) setVisits(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Visitas</Text>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : visits.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Nenhuma visita técnica"
          subtitle="Solicite uma visita técnica na tela de prestadores."
          ctaLabel="Ver prestadores"
          onCta={() => router.push('/(app)/(consumer)/providers/index')}
        />
      ) : (
        <FlashList
          data={visits}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/(consumer)/visits/${item.id}`)}
              style={[styles.card, { borderLeftColor: statusColors[item.status] ?? Colors.neutral[300] }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardProvider}>{item.provider_name}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>
              <Text style={styles.cardDate}>
                {item.preferred_date ? formatDateOnly(item.preferred_date) : 'Data a definir'}
              </Text>
            </Pressable>
          )}
          estimatedItemSize={100}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing[4] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  list: { padding: Spacing.screenHorizontal, paddingBottom: Spacing.tabBarSafeBuffer, gap: Spacing[3] },
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 4,
    gap: Spacing[1],
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardProvider: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  cardAddress: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  cardDate: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
});
