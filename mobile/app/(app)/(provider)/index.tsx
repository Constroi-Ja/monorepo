import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { authApi } from '@/api/auth';
import { visitsApi } from '@/api/visits';
import { storesApi } from '@/api/stores';
import { StoreCard } from '@/components/shared/StoreCard';
import { InfoBox } from '@/components/shared/InfoBox';
import { AppIcon } from '@/components/shared/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { Store, TechnicalVisitRequest } from '@/types';

export default function ProviderDashboard() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuthStore();
  const { colors } = useTheme();
  const addToast = useUiStore((s) => s.addToast);
  const provider = user?.provider_profile;

  const [isAvailable, setIsAvailable] = useState(provider?.is_available ?? false);
  const [pendingVisits, setPendingVisits] = useState<TechnicalVisitRequest[]>([]);
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [visitsRes, storesRes] = await Promise.allSettled([
      visitsApi.getMyVisits({ status: 'pending' }),
      storesApi.getFeatured(),
    ]);
    if (visitsRes.status === 'fulfilled' && visitsRes.value.data) setPendingVisits(visitsRes.value.data);
    if (storesRes.status === 'fulfilled' && storesRes.value.data) setFeaturedStores(storesRes.value.data);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (value: boolean) => {
    setIsAvailable(value);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await authApi.updateAvailability(value);
    if (error) {
      setIsAvailable(!value);
      addToast(error.message, 'error');
    } else {
      await refreshUser();
      addToast(value ? 'Você está disponível para visitas!' : 'Você não está disponível.');
    }
  };

  const firstName = user?.first_name ?? 'Prestador';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
    >
      <Text style={styles.greeting}>Olá, {firstName}!</Text>

      {/* Verification warning */}
      {provider && !provider.verified && (
        <InfoBox
          type="warning"
          title="Conta em verificação"
          message="Seu cadastro está sendo analisado. Você receberá uma notificação quando for aprovado."
        />
      )}

      {/* Availability Toggle */}
      <View style={styles.availabilityCard}>
        <View style={styles.availabilityInfo}>
          <Text style={styles.availabilityTitle}>Disponibilidade</Text>
          <Text style={styles.availabilitySubtitle}>
            {isAvailable ? 'Você está visível para novos clientes' : 'Você está oculto para novos clientes'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={handleToggleAvailability}
          trackColor={{ false: Colors.neutral[200], true: Colors.brand[400] }}
          thumbColor={isAvailable ? Colors.brand[500] : Colors.neutral[400]}
        />
      </View>

      {/* Pending visits counter */}
      <Pressable
        style={styles.pendingCard}
        onPress={() => router.push('/(app)/(provider)/visits/index')}
      >
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingCount}>{pendingVisits.length}</Text>
        </View>
        <View>
          <Text style={styles.pendingTitle}>Visitas pendentes</Text>
          <Text style={styles.pendingSubtitle}>Toque para ver e responder</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{provider?.rating_average != null ? Number(provider.rating_average).toFixed(1) : '--'}</Text>
          <Text style={styles.statLabel}>Avaliação</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{provider?.rating_count ?? 0}</Text>
          <Text style={styles.statLabel}>Avaliações</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{provider?.coverage_radius_km ?? '--'} km</Text>
          <Text style={styles.statLabel}>Raio</Text>
        </View>
      </View>

      {/* Featured stores */}
      <Text style={styles.sectionTitle}>Comprar materiais</Text>
      {featuredStores.slice(0, 3).map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onPress={() => router.push(`/(app)/(provider)/stores/index`)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing.tabBarSafeBuffer },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  availabilityCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  availabilityInfo: { flex: 1, gap: 4 },
  availabilityTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[900] },
  availabilitySubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  pendingCard: {
    backgroundColor: Colors.brand[500],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  pendingBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCount: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0] },
  pendingTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[0] },
  pendingSubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  arrow: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0], marginLeft: 'auto' },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  statCard: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    padding: Spacing[3],
    alignItems: 'center',
    gap: 4,
    ...Shadows.xs,
  },
  statValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.neutral[900] },
});
