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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';
import { ordersApi } from '@/api/orders';
import { Order } from '@/types';
import { OrderCard } from '@/components/shared/OrderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

const STATUS_FILTERS = ['Todos', 'pendente', 'confirmado', 'enviado', 'entregue', 'cancelado'];
const STATUS_LABELS: Record<string, string> = {
  Todos: 'Todos', pendente: 'Pendente', confirmado: 'Confirmado',
  enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado',
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Todos');

  const load = useCallback(async () => {
    const { data } = await ordersApi.getMyOrders(
      filter !== 'Todos' ? { status: filter } : undefined
    );
    if (data) setOrders(data);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Pedidos</Text>
        <FlatList
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setFilter(item)}
              style={[styles.chip, filter === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
                {STATUS_LABELS[item]}
              </Text>
            </Pressable>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        />
      </View>

      {loading ? (
        <LoadingScreen />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="package"
          title="Nenhum pedido encontrado"
          subtitle="Seus pedidos aparecerão aqui."
          ctaLabel="Ver materiais"
          onCta={() => router.push('/(app)/(consumer)/stores/index')}
        />
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push(`/(app)/(consumer)/orders/${item.id}`)}
            />
          )}
          estimatedItemSize={100}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, gap: Spacing[3], paddingVertical: Spacing[4] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  chips: { gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[0] },
  chipActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  chipTextActive: { color: Colors.neutral[0] },
  list: { padding: Spacing.screenHorizontal, paddingBottom: Spacing.tabBarSafeBuffer },
});
