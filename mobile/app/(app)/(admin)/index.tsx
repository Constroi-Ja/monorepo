import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { adminApi } from '@/api/admin';
import { AdminStats, Provider } from '@/types';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { AppIcon, AppIconName } from '@/components/shared/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { logout, user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoadError(false);
    const [statsRes, providersRes] = await Promise.allSettled([
      adminApi.getStats(),
      adminApi.getProviders({ verified: false }),
    ]);
    if (statsRes.status === 'fulfilled' && statsRes.value.data) {
      setStats(statsRes.value.data);
    } else if (statsRes.status === 'rejected' || (statsRes.status === 'fulfilled' && !statsRes.value.data)) {
      setLoadError(true);
    }
    if (providersRes.status === 'fulfilled' && providersRes.value.data) setPendingProviders(providersRes.value.data);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <LoadingScreen />;

  const statItems: { label: string; value: number; icon: AppIconName }[] = stats ? [
    { label: 'Total Usuários',  value: stats.total_users,          icon: 'users-group'  },
    { label: 'Consumidores',    value: stats.total_consumers,      icon: 'shopping-cart' },
    { label: 'Prestadores',     value: stats.total_providers,      icon: 'hammer'       },
    { label: 'Empresas',        value: stats.total_companies,      icon: 'store'        },
    { label: 'Verificados',     value: stats.verified_providers,   icon: 'checkmark'    },
    { label: 'Produtos',        value: stats.total_items,          icon: 'package'      },
  ] : [];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
    >
      <Text style={styles.title}>Painel Admin</Text>

      {loadError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Não foi possível carregar as estatísticas. Puxe para atualizar.</Text>
        </View>
      )}

      <View style={styles.grid}>
        {statItems.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <AppIcon name={item.icon} size={28} color={Colors.brand[400]} />
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {pendingProviders.length > 0 && (
        <>
          <Pressable
            onPress={() => router.push('/(app)/(admin)/providers/index')}
            style={styles.alertBanner}
          >
            <Text style={styles.alertText}>
              {pendingProviders.length} prestador(es) aguardando verificação
            </Text>
            <Text style={styles.alertArrow}>›</Text>
          </Pressable>
        </>
      )}

      <View style={styles.quickLinks}>
        {([
          { label: 'Usuários',   icon: 'users-group' as AppIconName, route: '/(app)/(admin)/users/index' },
          { label: 'Prestadores',icon: 'hammer'      as AppIconName, route: '/(app)/(admin)/providers/index' },
          { label: 'Lojas',      icon: 'store'       as AppIconName, route: '/(app)/(admin)/stores/index' },
          { label: 'Avaliações', icon: 'star'        as AppIconName, route: '/(app)/(admin)/reviews/index' },
        ]).map((link) => (
          <Pressable
            key={link.label}
            onPress={() => router.push(link.route as any)}
            style={styles.quickLink}
          >
            <AppIcon name={link.icon} size={24} color={Colors.neutral[400]} />
            <Text style={styles.quickLinkLabel}>{link.label}</Text>
            <Text style={styles.quickLinkArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* User info + logout */}
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>Logado como</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert('Sair', 'Deseja sair da conta admin?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: logout },
            ])
          }
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[900] },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[5], paddingBottom: Spacing[10] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  statCard: {
    width: '47%',
    backgroundColor: Colors.neutral[800],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[1],
  },
  statValue: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0] },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[400] },
  alertBanner: {
    backgroundColor: Colors.warning.dark,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[0], flex: 1 },
  alertArrow: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[0] },
  quickLinks: { gap: Spacing[2] },
  quickLink: {
    backgroundColor: Colors.neutral[800],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  quickLinkLabel: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[0] },
  quickLinkArrow: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[500] },
  userCard: {
    backgroundColor: Colors.neutral[800],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.neutral[700],
  },
  userInfo: { flex: 1, gap: 2 },
  userLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  userEmail: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[200] },
  logoutBtn: {
    backgroundColor: Colors.error.dark,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  logoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.neutral[0] },
  errorBox: {
    backgroundColor: Colors.error.light,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: Colors.error.base,
  },
  errorText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.error.dark },
});
