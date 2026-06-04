import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { cartApi } from '@/api/cart';
import { ordersApi } from '@/api/orders';
import { paymentsApi } from '@/api/payments';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { PixQRCard } from '@/components/shared/PixQRCard';
import { Button } from '@/components/shared/Button';
import { InfoBox } from '@/components/shared/InfoBox';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';

type Step = 'review' | 'pix';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const resetCart = useCartStore((s) => s.reset);

  const [step, setStep] = useState<Step>('review');
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [qrCode, setQrCode] = useState<{ base64: string; text: string } | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);

  useEffect(() => {
    cartApi.getCart().then(({ data }) => {
      if (data) setItems(data);
    }).finally(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data, error: err } = await ordersApi.create({
        payment_method: 'pix',
      });
      if (err) throw new Error(err.message);
      setOrderId(data.order.id);
      setPaymentId(data.payment.payment_id);
      setQrCode({ base64: data.payment.qr_code_base64, text: data.payment.qr_code_text });
      setStep('pix');
    } catch (e: any) {
      setError(e.message || 'Erro ao processar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproved = () => {
    resetCart();
    router.replace(`/(app)/(consumer)/orders/${orderId}`);
  };

  const handleCancelled = () => {
    setPaymentFailed(true);
  };

  const handleSimulateApprove = async () => {
    if (!paymentId) return;
    await paymentsApi.simulateApprove(paymentId);
  };

  usePaymentStatus(paymentId, handleApproved, handleCancelled);

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);

  if (loading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.surface.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>{step === 'review' ? 'Revisar pedido' : 'Pagamento PIX'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'review' && (
          <>
            {error ? <InfoBox type="error" message={error} /> : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resumo dos itens</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.item.name}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(String(item.total))}</Text>
                </View>
              ))}
            </View>

            {user?.consumer_profile && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados do pagador</Text>
                <View style={styles.infoGrid}>
                  <InfoRow label="Nome" value={user.consumer_profile.full_name} />
                  <InfoRow label="CPF" value={user.consumer_profile.cpf} />
                  <InfoRow label="E-mail" value={user.email} />
                  <InfoRow label="Endereço" value={`${user.consumer_profile.street}, ${user.consumer_profile.number}`} />
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>

            <Button onPress={handlePay} label="Pagar com PIX" loading={submitting} size="lg" />
          </>
        )}

        {step === 'pix' && qrCode && (
          <>
            {paymentFailed && (
              <InfoBox
                type="error"
                title="Pagamento não concluído"
                message="O pagamento foi cancelado ou rejeitado. Tente novamente."
                style={{ marginBottom: Spacing[4] }}
              />
            )}

            <View style={styles.section}>
              <PixQRCard
                qrCodeBase64={qrCode.base64}
                qrCodeText={qrCode.text}
              />
            </View>

            <View style={styles.section}>
              <InfoBox
                type="info"
                message="Aguardando confirmação do pagamento..."
              />
            </View>

            {__DEV__ && (
              <Button
                onPress={handleSimulateApprove}
                label="🧪 Simular aprovação (DEV)"
                variant="ghost"
              />
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[1] },
  label: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  value: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[800], flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[3], gap: Spacing[1] },
  back: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[500] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[5], paddingBottom: Spacing[10] },
  section: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  itemName: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[700] },
  itemQty: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
  itemPrice: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.brand[500] },
  infoGrid: { gap: Spacing[1] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  totalValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.brand[500] },
});
