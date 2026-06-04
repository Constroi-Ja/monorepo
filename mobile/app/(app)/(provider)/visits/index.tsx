import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { visitsApi } from '@/api/visits';
import { TechnicalVisitRequest } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { useUiStore } from '@/store/uiStore';
import { formatDateOnly } from '@/utils/date';

type Tab = 'pending' | 'accepted' | 'completed' | 'refused' | 'cancelled';

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'accepted', label: 'Aceitas' },
  { key: 'completed', label: 'Concluídas' },
  { key: 'refused', label: 'Recusadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

function PendingCountdown({ pendingSince }: { pendingSince: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const calc = () => {
      const expiresAt = new Date(pendingSince).getTime() + 20 * 60 * 1000;
      return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    };
    setSecondsLeft(calc());
    const id = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [pendingSince]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const critical = secondsLeft < 300;
  const expired = secondsLeft === 0;

  return (
    <Text style={[styles.countdown, critical && styles.countdownCritical]}>
      {expired ? '⏰ Expirado' : `⏱ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} para responder`}
    </Text>
  );
}

export default function ProviderVisitsScreen() {
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [visits, setVisits] = useState<TechnicalVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await visitsApi.getMyVisits({ status: activeTab });
    if (data) setVisits(data);
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAction = async (visit: TechnicalVisitRequest, action: 'accept' | 'refuse') => {
    Alert.alert(
      action === 'accept' ? 'Aceitar visita' : 'Recusar visita',
      `Confirma ${action === 'accept' ? 'aceitar' : 'recusar'} a visita de ${visit.consumer_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await visitsApi.update(visit.id, { action });
            addToast(action === 'accept' ? 'Visita aceita!' : 'Visita recusada.');
            await load();
          },
        },
      ]
    );
  };

  const handleComplete = async (visit: TechnicalVisitRequest) => {
    Alert.alert('Concluir visita', 'Confirmar conclusão da visita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Concluir',
        onPress: async () => {
          await visitsApi.complete(visit.id);
          addToast('Visita marcada como concluída!');
          await load();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Painel de Visitas</Text>

      <FlatList
        data={TABS}
        keyExtractor={(t) => t.key}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setActiveTab(item.key)}
            style={[styles.tab, activeTab === item.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabBar}
      />

      {loading ? (
        <LoadingScreen />
      ) : visits.length === 0 ? (
        <EmptyState icon="calendar" title="Nenhuma visita" subtitle={`Sem visitas ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()}.`} />
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.consumerName}>{item.consumer_name}</Text>
                  <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                  {item.preferred_date && (
                    <Text style={styles.date}>{formatDateOnly(item.preferred_date)}</Text>
                  )}
                </View>
                <StatusBadge status={item.status} />
              </View>

              {item.notes && (
                <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
              )}

              {activeTab === 'pending' && item.pending_since && (
                <PendingCountdown pendingSince={item.pending_since} />
              )}

              {activeTab === 'pending' && (
                <View style={styles.actions}>
                  <Button
                    onPress={() => handleAction(item, 'refuse')}
                    label="Recusar"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    fullWidth={false}
                  />
                  <Button
                    onPress={() => handleAction(item, 'accept')}
                    label="Aceitar"
                    size="sm"
                    style={{ flex: 1 }}
                    fullWidth={false}
                  />
                </View>
              )}

              {activeTab === 'accepted' && (
                <Button
                  onPress={() => handleComplete(item)}
                  label="Marcar como concluída"
                  size="sm"
                />
              )}
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
  root: { flex: 1, backgroundColor: Colors.surface.background },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900], paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing[2] },
  tabBar: { maxHeight: 56 },
  tabs: { paddingHorizontal: Spacing.screenHorizontal, gap: 8, alignItems: 'center', paddingVertical: Spacing[2] },
  tab: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[0] },
  tabActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  tabText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  tabTextActive: { color: Colors.neutral[0] },
  list: { padding: Spacing.screenHorizontal, gap: Spacing[3], paddingBottom: Spacing.tabBarSafeBuffer },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  consumerName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  address: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500], marginTop: 2 },
  date: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  notes: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[600], fontStyle: 'italic' },
  countdown: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.neutral[600] },
  countdownCritical: { color: Colors.error.base },
  actions: { flexDirection: 'row', gap: Spacing[3] },
});
