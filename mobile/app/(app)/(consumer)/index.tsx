import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { storesApi } from '@/api/stores';
import { providersApi } from '@/api/providers';
import { ordersApi } from '@/api/orders';
import { visitsApi } from '@/api/visits';
import { StoreCard } from '@/components/shared/StoreCard';
import { ProviderCard } from '@/components/shared/ProviderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { InfoBox } from '@/components/shared/InfoBox';
import { AppIcon } from '@/components/shared/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { Store, Provider, Order, TechnicalVisitRequest } from '@/types';

export default function ConsumerDashboard() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [pendingVisit, setPendingVisit] = useState<TechnicalVisitRequest | null>(null);

  const load = useCallback(async () => {
    const [storesRes, providersRes, ordersRes, visitsRes] = await Promise.allSettled([
      storesApi.getFeatured(),
      providersApi.getNearby(),
      ordersApi.getMyOrders({ limit: 1 }),
      visitsApi.getMyVisits({ status: 'pending', limit: 3 }),
    ]);

    if (storesRes.status === 'fulfilled' && storesRes.value.data) {
      setStores(storesRes.value.data);
    }
    if (providersRes.status === 'fulfilled' && providersRes.value.data) {
      setProviders(providersRes.value.data);
    }
    if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
      const orders = ordersRes.value.data;
      const active = orders.find((o) => o.status !== 'entregue' && o.status !== 'cancelado');
      setActiveOrder(active ?? null);
    }
    if (visitsRes.status === 'fulfilled' && visitsRes.value.data) {
      setPendingVisit(visitsRes.value.data[0] ?? null);
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

  const firstName = user?.first_name || user?.consumer_profile?.full_name?.split(' ')[0] || 'você';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.brand[500]}
          colors={[Colors.brand[500]]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {firstName}!</Text>
          <Text style={styles.subtitle}>O que você precisa hoje?</Text>
        </View>
      </View>

      {/* Search bar */}
      <Pressable
        onPress={() => router.push('/(app)/(consumer)/stores/index')}
        style={styles.searchBar}
      >
        <AppIcon name="search" size={18} color={Colors.neutral[400]} />
        <Text style={styles.searchPlaceholder}>Buscar materiais, lojas...</Text>
      </Pressable>

      {/* Alerts */}
      {activeOrder && (
        <Pressable onPress={() => router.push(`/(app)/(consumer)/orders/${activeOrder.id}`)}>
          <InfoBox
            type="info"
            title="Pedido em andamento"
            message={`Pedido em ${activeOrder.company_name} — ${activeOrder.status_display}`}
          />
        </Pressable>
      )}

      {pendingVisit && (
        <Pressable onPress={() => router.push(`/(app)/(consumer)/visits/${pendingVisit.id}`)}>
          <InfoBox
            type="warning"
            title="Visita técnica pendente"
            message={`Com ${pendingVisit.provider_name} — aguardando confirmação`}
          />
        </Pressable>
      )}

      {/* Featured Stores */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lojas em destaque</Text>
          <Pressable onPress={() => router.push('/(app)/(consumer)/stores/index')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </Pressable>
        </View>
        {stores.length > 0 ? (
          <FlatList
            data={stores}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <StoreCard
                store={item}
                horizontal
                onPress={() => router.push(`/(app)/(consumer)/stores/${item.id}`)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.screenHorizontal }}
            nestedScrollEnabled
          />
        ) : (
          <Text style={styles.emptyText}>Nenhuma loja encontrada.</Text>
        )}
      </View>

      {/* Nearby Providers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prestadores próximos</Text>
          <Pressable onPress={() => router.push('/(app)/(consumer)/providers/index')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </Pressable>
        </View>
        {providers.length > 0 ? (
          <FlatList
            data={providers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ProviderCard
                provider={item}
                onPress={() => router.push('/(app)/(consumer)/providers/index')}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.screenHorizontal }}
            nestedScrollEnabled
          />
        ) : (
          <Text style={styles.emptyText}>Nenhum prestador próximo.</Text>
        )}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <FlatList
          data={['Cimento', 'Tintas', 'Ferragens', 'Madeiras', 'Elétrica', 'Hidráulica']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={styles.categoryChip}
              onPress={() => router.push('/(app)/(consumer)/stores/index')}
            >
              <Text style={styles.categoryText}>{item}</Text>
            </Pressable>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.screenHorizontal, gap: 8 }}
          nestedScrollEnabled
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { gap: Spacing[5], paddingBottom: Spacing.tabBarSafeBuffer },
  header: {
    paddingHorizontal: Spacing.screenHorizontal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.neutral[900],
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  searchBar: {
    marginHorizontal: Spacing.screenHorizontal,
    height: 52,
    backgroundColor: Colors.neutral[0],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  searchPlaceholder: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[400],
  },
  section: { gap: Spacing[3] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.neutral[900],
  },
  seeAll: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.brand[500],
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.neutral[400],
    paddingHorizontal: Spacing.screenHorizontal,
  },
  categoryChip: {
    backgroundColor: Colors.brand[50],
    borderRadius: 999,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.brand[200],
  },
  categoryText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.brand[700],
  },
});
