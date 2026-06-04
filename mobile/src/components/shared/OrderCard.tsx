import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { Order } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/utils/currency';
import { formatDateOnly } from '@/utils/date';

const statusColors: Record<string, string> = {
  pendente: Colors.warning.base,
  confirmado: Colors.info.base,
  enviado: Colors.brand[500],
  entregue: Colors.success.base,
  cancelado: Colors.error.base,
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  showBuyer?: boolean;
}

export function OrderCard({ order, onPress, showBuyer = false }: OrderCardProps) {
  const borderColor = statusColors[order.status] ?? Colors.neutral[300];

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.company}>{order.company_name}</Text>
          {showBuyer && (
            <Text style={styles.buyer}>Cliente: {order.buyer_name}</Text>
          )}
        </View>
        <StatusBadge status={order.status} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.items}>{order.items.length} item(s)</Text>
        <Text style={styles.total}>{formatCurrency(order.total_amount)}</Text>
      </View>
      <Text style={styles.date}>{formatDateOnly(order.created_at)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 4,
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  company: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  buyer: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  items: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.neutral[500],
  },
  total: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.brand[500],
  },
  date: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.neutral[400],
  },
});
