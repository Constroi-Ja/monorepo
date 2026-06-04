import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

type Status =
  | 'pendente'
  | 'confirmado'
  | 'enviado'
  | 'entregue'
  | 'cancelado'
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'completed'
  | 'awaiting_payment'
  | 'approved'
  | 'verified'
  | string;

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pendente: { bg: Colors.warning.light, text: Colors.warning.dark, label: 'Pendente' },
  confirmado: { bg: Colors.info.light, text: Colors.info.dark, label: 'Confirmado' },
  enviado: { bg: Colors.brand[100], text: Colors.brand[700], label: 'Enviado' },
  entregue: { bg: Colors.success.light, text: Colors.success.dark, label: 'Entregue' },
  cancelado: { bg: Colors.error.light, text: Colors.error.dark, label: 'Cancelado' },
  pending: { bg: Colors.warning.light, text: Colors.warning.dark, label: 'Pendente' },
  awaiting_payment: { bg: Colors.neutral[100], text: Colors.neutral[600], label: 'Aguard. Pagto' },
  accepted: { bg: Colors.brand[100], text: Colors.brand[700], label: 'Aceita' },
  refused: { bg: Colors.error.light, text: Colors.error.dark, label: 'Recusada' },
  completed: { bg: Colors.success.light, text: Colors.success.dark, label: 'Concluída' },
  cancelled: { bg: Colors.error.light, text: Colors.error.dark, label: 'Cancelada' },
  approved: { bg: Colors.success.light, text: Colors.success.dark, label: 'Aprovado' },
  verified: { bg: Colors.success.light, text: Colors.success.dark, label: 'Verificado' },
};

interface StatusBadgeProps {
  status: Status;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: Colors.neutral[100],
    text: Colors.neutral[600],
    label: status,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {customLabel ?? config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
});
