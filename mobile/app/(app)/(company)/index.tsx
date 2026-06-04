import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { ordersApi } from '@/api/orders';
import { Order } from '@/types';
import { OrderCard } from '@/components/shared/OrderCard';
import { InfoBox } from '@/components/shared/InfoBox';
import { formatCurrency } from '@/utils/currency';
import { AppIcon, AppIconName } from '@/components/shared/AppIcon';
import { useTheme } from '@/hooks/useTheme';

const FEATURES: { icon: AppIconName; title: string; subtitle: string; route: string }[] = [
  { icon: 'package',       title: 'Produtos',  subtitle: 'Gerenciar catálogo',   route: '/(app)/(company)/items/index' },
  { icon: 'delivery',      title: 'Entregas',  subtitle: 'Entregadores e raio',  route: '/(app)/(company)/deliveries/index' },
  { icon: 'clipboard',     title: 'Pedidos',   subtitle: 'Gerenciar vendas',     route: '/(app)/(company)/orders/index' },
  { icon: 'filing-cabinet',title: 'Estoque',   subtitle: 'Controle de estoque',  route: '/(app)/(company)/inventory/index' },
  { icon: 'money-bag',     title: 'Receitas',  subtitle: 'Análise financeira',   route: '/(app)/(company)/revenue/index' },
  { icon: 'credit-card',   title: 'Contas',    subtitle: 'Contas a pagar',       route: '/(app)/(company)/bills/index' },
];

export default function CompanyDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const company = user?.company_profile;

  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await ordersApi.getCompanyOrders({ status: 'pendente' });
    if (data) {
      // Filtro client-side como segurança (API pode retornar todos)
      const pending = data.filter(o => !['entregue', 'cancelado', 'recusado'].includes(o.status));
      setPendingOrders(pending.slice(0, 3));
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {company?.company_name ?? user?.first_name}!</Text>
        <Text style={styles.subtitle}>Painel operacional</Text>
      </View>

      {company && !company.onboarding_completed && (
        <InfoBox
          type="warning"
          title="Complete seu cadastro"
          message="Configure horários e chave PIX para começar a vender."
        />
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{company?.rating_average != null ? Number(company.rating_average).toFixed(1) : '--'}</Text>
          <Text style={styles.statLabel}>Avaliação</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pendingOrders.length}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{company?.display_radius_km ?? '--'}km</Text>
          <Text style={styles.statLabel}>Raio</Text>
        </View>
      </View>

      {/* Quick access grid */}
      <Text style={styles.sectionTitle}>Módulos</Text>
      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <Pressable
            key={f.title}
            onPress={() => router.push(f.route as any)}
            style={({ pressed }) => [styles.featureCard, pressed && { opacity: 0.85 }]}
          >
            <AppIcon name={f.icon} size={28} color={Colors.brand[500]} />
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureSubtitle}>{f.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      {/* Recent pending orders */}
      {pendingOrders.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Pedidos pendentes</Text>
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showBuyer
              onPress={() => router.push(`/(app)/(company)/orders/${order.id}`)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing.tabBarSafeBuffer },
  header: { gap: 2 },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[500] },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  stat: { flex: 1, backgroundColor: Colors.neutral[0], borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center', gap: 4, ...Shadows.xs },
  statValue: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.neutral[900] },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.neutral[900] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  featureCard: {
    width: '47%',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[1],
    ...Shadows.sm,
  },
  featureTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  featureSubtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
});
