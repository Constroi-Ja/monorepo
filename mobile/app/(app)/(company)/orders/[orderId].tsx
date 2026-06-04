import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { ordersApi } from '@/api/orders';
import { Order } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/shared/Button';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { useUiStore } from '@/store/uiStore';

const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  pendente: { label: 'Confirmar pedido', next: 'confirmado' },
  confirmado: { label: 'Marcar como enviado', next: 'enviado' },
  enviado: { label: 'Marcar como entregue', next: 'entregue' },
};

export default function CompanyOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const { data } = await ordersApi.getById(Number(orderId));
    if (data) setOrder(data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleAdvanceStatus = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    Alert.alert('Avançar status', `Confirmar: "${next.label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setUpdating(true);
          const { error } = await ordersApi.updateStatus(order.id, next.next);
          if (error) {
            addToast(error.message, 'error');
          } else {
            addToast('Status atualizado!');
            await load();
          }
          setUpdating(false);
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!order) return null;

  const nextAction = NEXT_STATUS[order.status];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Pedido #{order.id}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.buyer}>Cliente: {order.buyer_name}</Text>
        <Text style={styles.date}>{formatDateTime(order.created_at)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do pedido</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image
                source={item.item_photo_url ? { uri: item.item_photo_url } : require('@/assets/placeholder-product.png')}
                style={styles.itemThumb}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemBrand}>{item.item_marca}</Text>
              </View>
              <View>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.unit_price)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total</Text>
            <Text style={styles.rowValue}>{formatCurrency(order.total_amount)}</Text>
          </View>
          {order.shipping_cost && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Frete</Text>
              <Text style={styles.rowValue}>{formatCurrency(order.shipping_cost)}</Text>
            </View>
          )}
        </View>

        {nextAction && (
          <Button onPress={handleAdvanceStatus} label={nextAction.label} loading={updating} size="lg" />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[3], gap: Spacing[1] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[500] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  buyer: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.neutral[700] },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[400] },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing[10] },
  section: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  itemRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  itemThumb: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.neutral[100] },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[800] },
  itemBrand: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  itemQty: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500], textAlign: 'right' },
  itemPrice: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.brand[500] },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[500] },
  rowValue: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.neutral[800] },
});
