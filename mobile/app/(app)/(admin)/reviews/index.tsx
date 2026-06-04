import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { adminApi } from '@/api/admin';
import { Review } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { formatDateOnly } from '@/utils/date';

type Filter = 'all' | 'provider' | 'company';

export default function AdminReviewsScreen() {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    const { data } = await adminApi.getReviews(filter !== 'all' ? { target_type: filter } : undefined);
    if (data) setReviews(data);
  }, [filter]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [filter]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const STARS = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Avaliações</Text>
        <View style={styles.filters}>
          {(['all', 'provider', 'company'] as Filter[]).map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Todas' : f === 'provider' ? 'Prestadores' : 'Empresas'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? <LoadingScreen /> : reviews.length === 0 ? (
        <EmptyState icon="star" title="Nenhuma avaliação" subtitle="As avaliações da plataforma aparecerão aqui." />
      ) : (
        <FlashList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.reviewer}>{item.reviewer_name}</Text>
                  <Text style={styles.target}>→ {item.target_name} ({item.target_type})</Text>
                </View>
                <View>
                  <Text style={styles.stars}>{STARS(item.rating)}</Text>
                  <Text style={styles.date}>{formatDateOnly(item.created_at)}</Text>
                </View>
              </View>
              {item.comment && <Text style={styles.comment}>"{item.comment}"</Text>}
            </View>
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
  root: { flex: 1, backgroundColor: Colors.neutral[900] },
  header: { padding: Spacing.screenHorizontal, gap: Spacing[3] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0] },
  filters: { flexDirection: 'row', backgroundColor: Colors.neutral[800], borderRadius: Radius.lg, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  filterBtnActive: { backgroundColor: Colors.neutral[700] },
  filterText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
  filterTextActive: { color: Colors.neutral[0] },
  list: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[10], gap: Spacing[3] },
  card: { backgroundColor: Colors.neutral[800], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[2] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewer: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[0] },
  target: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[400] },
  stars: { fontSize: 14, textAlign: 'right' },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500], textAlign: 'right' },
  comment: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[300], fontStyle: 'italic' },
});
