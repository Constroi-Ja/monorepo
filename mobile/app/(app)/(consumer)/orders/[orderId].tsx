import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { ordersApi } from '@/api/orders';
import { adminApi } from '@/api/admin';
import { Order } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/shared/Button';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { InfoBox } from '@/components/shared/InfoBox';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';

const TIMELINE_STEPS = [
  { key: 'pendente', label: 'Pedido criado' },
  { key: 'confirmado', label: 'Pagamento aprovado' },
  { key: 'enviado', label: 'Em rota' },
  { key: 'entregue', label: 'Entregue' },
];

const STATUS_ORDER = ['pendente', 'confirmado', 'enviado', 'entregue'];

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    const { data } = await ordersApi.getById(Number(orderId));
    if (data) setOrder(data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCancel = () => {
    Alert.alert('Cancelar pedido', 'Tem certeza que deseja cancelar este pedido?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          await ordersApi.updateStatus(Number(orderId), 'cancelado');
          await load();
          setCancelling(false);
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!order) return (
    <View style={styles.root}>
      <InfoBox type="error" message="Pedido não encontrado." style={{ margin: 16 }} />
    </View>
  );

  const currentStepIndex = STATUS_ORDER.indexOf(order.status);

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
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />
        }
      >
        {/* Timeline */}
        {order.status !== 'cancelado' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acompanhe seu pedido</Text>
            <View style={styles.timeline}>
              {TIMELINE_STEPS.map((step, i) => {
                const completed = i <= currentStepIndex;
                const current = i === currentStepIndex;
                return (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineCircle,
                        completed && styles.timelineCircleCompleted,
                        current && styles.timelineCircleCurrent,
                      ]}>
                        <Text style={styles.timelineCircleText}>{completed ? '✓' : ''}</Text>
                      </View>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <View style={[styles.timelineLine, completed && styles.timelineLineCompleted]} />
                      )}
                    </View>
                    <Text style={[styles.timelineLabel, completed && styles.timelineLabelCompleted]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{order.company_name}</Text>
          <Text style={styles.date}>{formatDateTime(order.created_at)}</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image
                source={item.item_photo_url ? { uri: item.item_photo_url } : require('@/assets/placeholder-product.png')}
                style={styles.itemThumb}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemBrand}>{item.item_marca}</Text>
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.unit_price)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Financial */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Subtotal</Text>
            <Text style={styles.rowValue}>{formatCurrency(String(parseFloat(order.total_amount) - parseFloat(order.shipping_cost ?? '0')))}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Frete</Text>
            <Text style={styles.rowValue}>{order.shipping_cost ? formatCurrency(order.shipping_cost) : 'Grátis'}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total_amount)}</Text>
          </View>
        </View>

        {/* Actions */}
        {order.status === 'pendente' && (
          <Button
            onPress={handleCancel}
            label="Cancelar pedido"
            variant="destructive"
            loading={cancelling}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[3], gap: Spacing[2] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[500] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing[10] },
  section: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[900] },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  timeline: { gap: 0 },
  timelineStep: { flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.neutral[300], alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral[0] },
  timelineCircleCompleted: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  timelineCircleCurrent: { borderColor: Colors.brand[500] },
  timelineCircleText: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.neutral[0] },
  timelineLine: { width: 2, height: 32, backgroundColor: Colors.neutral[200], marginTop: 2 },
  timelineLineCompleted: { backgroundColor: Colors.brand[500] },
  timelineLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500], paddingTop: 4, flex: 1 },
  timelineLabelCompleted: { color: Colors.neutral[800], fontFamily: FontFamily.medium },
  itemRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  itemThumb: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.neutral[100] },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[800] },
  itemBrand: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  itemMeta: { alignItems: 'flex-end' },
  itemQty: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  itemPrice: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.brand[500] },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  rowValue: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700] },
  totalRow: { paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.neutral[100] },
  totalLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[900] },
  totalValue: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.brand[500] },
});
