import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { ordersApi } from '@/api/orders';
import { formatCurrency } from '@/utils/currency';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { AppIcon, AppIconName } from '@/components/shared/AppIcon';

type Period = 'week' | 'month' | 'year';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - Spacing.screenHorizontal * 2 - Spacing[4] * 2;

export default function RevenueScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data: res } = await ordersApi.getStats(period);
    setData(res);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const PERIODS = [
    { key: 'week' as Period, label: 'Semana' },
    { key: 'month' as Period, label: 'Mês' },
    { key: 'year' as Period, label: 'Ano' },
  ];

  if (loading) return <LoadingScreen />;

  const totalRevenue = data?.total_revenue ?? 0;
  const totalOrders = data?.total_orders ?? 0;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
    >
      <Text style={styles.title}>Receitas</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <KPICard title="Receita total" value={formatCurrency(totalRevenue)} icon="money-bag" />
        <KPICard title="Pedidos" value={String(totalOrders)} icon="package" />
      </View>
      <View style={styles.kpiRow}>
        <KPICard title="Ticket médio" value={formatCurrency(avgTicket)} icon="ticket" />
        <KPICard title="Taxa entrega" value={`${data?.delivery_rate ?? 0}%`} icon="delivery" />
      </View>

      {/* Simple bar chart placeholder */}
      {data?.daily_revenue && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Receita por período</Text>
          <View style={styles.chartBars}>
            {data.daily_revenue.slice(-7).map((entry: any, i: number) => {
              const max = Math.max(...data.daily_revenue.map((e: any) => e.amount));
              const height = max > 0 ? (entry.amount / max) * 120 : 4;
              return (
                <View key={i} style={styles.barWrapper}>
                  <View style={[styles.bar, { height }]} />
                  <Text style={styles.barLabel} numberOfLines={1}>{entry.label ?? String(i + 1)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Status distribution */}
      {data?.status_distribution && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Pedidos por status</Text>
          {Object.entries(data.status_distribution).map(([status, count]) => (
            <View key={status} style={styles.statusRow}>
              <Text style={styles.statusLabel}>{status}</Text>
              <Text style={styles.statusCount}>{count as number}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function KPICard({ title, value, icon }: { title: string; value: string; icon: AppIconName }) {
  return (
    <View style={kpiStyles.card}>
      <AppIcon name={icon} size={28} color={Colors.brand[500]} />
      <Text style={kpiStyles.value}>{value}</Text>
      <Text style={kpiStyles.title}>{title}</Text>
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], alignItems: 'center', gap: Spacing[1], ...Shadows.sm },
  value: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  title: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500], textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing.tabBarSafeBuffer },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  periodRow: { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: Radius.lg, padding: 4 },
  periodBtn: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.neutral[0], ...Shadows.xs },
  periodText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
  periodTextActive: { color: Colors.brand[600], fontFamily: FontFamily.semiBold },
  kpiRow: { flexDirection: 'row', gap: Spacing[3] },
  chartCard: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[3], ...Shadows.sm },
  chartTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[900] },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 140, justifyContent: 'space-around' },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '100%', backgroundColor: Colors.brand[500], borderRadius: Radius.sm, minHeight: 4 },
  barLabel: { fontFamily: FontFamily.regular, fontSize: 8, color: Colors.neutral[500] },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[1] },
  statusLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[600] },
  statusCount: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.neutral[800] },
});
