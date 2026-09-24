import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import MaskInput from 'react-native-mask-input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { providersApi } from '@/api/providers';
import { visitsApi } from '@/api/visits';
import { paymentsApi } from '@/api/payments';
import { Provider, TechnicalVisitRequest, CreateVisitResponse } from '@/types';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { InfoBox } from '@/components/shared/InfoBox';
import { Button } from '@/components/shared/Button';
import { PixQRCard } from '@/components/shared/PixQRCard';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useCEP } from '@/hooks/useCEP';

type Step = 'profile' | 'form' | 'pix';

const CEP_MASK = [/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/];

export default function ProviderDetailScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const insets = useSafeAreaInsets();
  const { fetchCEP } = useCEP();

  const [step, setStep] = useState<Step>('profile');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState('');

  // Payment state
  const [visitId, setVisitId] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [qrCode, setQrCode] = useState<{ base64: string; text: string } | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);

  useEffect(() => {
    providersApi.getById(Number(providerId)).then(({ data }) => {
      if (data) setProvider(data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCEP = async (raw: string) => {
    if (raw.length !== 8) return;
    const result = await fetchCEP(raw);
    if (result) {
      setStreet(result.logradouro ?? '');
      setCity(result.localidade ?? '');
      setUf(result.uf ?? '');
    }
  };

  const handleSubmit = async () => {
    const address = `${street}, ${number}${complement ? `, ${complement}` : ''} - ${city}/${uf}`.trim();
    if (!street || !number || !city) {
      setError('Preencha o endereço completo (CEP, rua, número e cidade).');
      return;
    }
    if (!notes.trim()) {
      setError('Descreva o serviço que precisa.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data, error: err } = await visitsApi.create({
        provider: Number(providerId),
        notes: notes.trim(),
        preferred_date: preferredDate || undefined,
        address,
      });
      if (err) throw new Error(err.message);
      const res = data as CreateVisitResponse;
      setVisitId(res.visit.id);
      setPaymentId(res.payment.payment_id);
      setQrCode({
        base64: res.payment.qr_code_base64 ?? '',
        text: res.payment.qr_code_text ?? '',
      });
      setStep('pix');
    } catch (e: any) {
      setError(e.message || 'Erro ao criar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproved = () => {
    router.replace(`/(app)/(consumer)/visits/${visitId}` as any);
  };

  const handleCancelled = () => {
    setPaymentFailed(true);
  };

  const handleSimulateApprove = async () => {
    if (!paymentId) return;
    await paymentsApi.simulateApprove(paymentId);
  };

  usePaymentStatus(paymentId, handleApproved, handleCancelled);

  if (loading) return <LoadingScreen />;
  if (!provider) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backWrap}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <InfoBox type="error" message="Prestador não encontrado." style={{ margin: 16 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={step === 'profile' ? () => router.back() : () => setStep(step === 'pix' ? 'form' : 'profile')}>
          <Text style={styles.back}>‹ {step === 'profile' ? 'Voltar' : 'Anterior'}</Text>
        </Pressable>
        <Text style={styles.title}>
          {step === 'profile' ? 'Perfil do Prestador' : step === 'form' ? 'Solicitar Visita' : 'Pagamento PIX'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── STEP: PROFILE ── */}
        {step === 'profile' && (
          <>
            <View style={styles.card}>
              <View style={styles.profileRow}>
                <Image
                  source={provider.image_url ? { uri: provider.image_url } : require('@/assets/placeholder-avatar.png')}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.providerName}>{provider.full_name}</Text>
                  <View style={styles.chipsRow}>
                    {(provider.specialties || []).slice(0, 3).map((s) => (
                      <View key={s} style={styles.chip}>
                        <Text style={styles.chipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>⭐ {Number(provider.rating).toFixed(1)}</Text>
                  <Text style={styles.metaLabel}>Avaliação</Text>
                </View>
                {provider.distance > 0 && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{Number(provider.distance).toFixed(1)} km</Text>
                    <Text style={styles.metaLabel}>Distância</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Text style={[styles.metaValue, { color: provider.is_available ? Colors.success.dark : Colors.error.dark }]}>
                    {provider.is_available ? '● Disponível' : '● Indisponível'}
                  </Text>
                  <Text style={styles.metaLabel}>Status</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Especialidades</Text>
              <View style={styles.chipsRow}>
                {(provider.specialties || []).map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {!provider.verified && (
              <InfoBox type="warning" message="Este prestador ainda não foi verificado pela plataforma." />
            )}

            <Button
              onPress={() => setStep('form')}
              label="Solicitar visita técnica"
              size="lg"
              disabled={!provider.is_available}
            />
            {!provider.is_available && (
              <Text style={styles.unavailableNote}>Este prestador está indisponível no momento.</Text>
            )}
          </>
        )}

        {/* ── STEP: FORM ── */}
        {step === 'form' && (
          <>
            {error ? <InfoBox type="error" message={error} /> : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Endereço do serviço</Text>

              <Text style={styles.fieldLabel}>CEP</Text>
              <MaskInput
                style={styles.input}
                value={cep}
                onChangeText={(masked, raw) => { setCep(masked); handleCEP(raw); }}
                mask={CEP_MASK}
                keyboardType="numeric"
                placeholder="00000-000"
                placeholderTextColor={Colors.neutral[400]}
              />

              <Text style={styles.fieldLabel}>Rua</Text>
              <TextInput
                style={styles.input}
                value={street}
                onChangeText={setStreet}
                placeholder="Nome da rua"
                placeholderTextColor={Colors.neutral[400]}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Número</Text>
                  <TextInput
                    style={styles.input}
                    value={number}
                    onChangeText={setNumber}
                    placeholder="Nº"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.neutral[400]}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>Complemento</Text>
                  <TextInput
                    style={styles.input}
                    value={complement}
                    onChangeText={setComplement}
                    placeholder="Apto, bloco..."
                    placeholderTextColor={Colors.neutral[400]}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Cidade / UF</Text>
              <TextInput
                style={styles.input}
                value={`${city}${uf ? ' / ' + uf : ''}`}
                editable={false}
                placeholder="Preenchido pelo CEP"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Serviço solicitado</Text>

              <Text style={styles.fieldLabel}>Descrição do serviço *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Descreva o que precisa ser feito..."
                placeholderTextColor={Colors.neutral[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Data preferencial (opcional)</Text>
              <MaskInput
                style={styles.input}
                value={preferredDate}
                onChangeText={(masked) => setPreferredDate(masked)}
                mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
                keyboardType="numeric"
                placeholder="DD/MM/AAAA"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Valor da visita técnica</Text>
                <Text style={styles.priceValue}>R$ 80,00</Text>
              </View>
              <Text style={styles.priceNote}>Pagamento via PIX após confirmação</Text>
            </View>

            <Button
              onPress={handleSubmit}
              label="Confirmar e pagar com PIX"
              size="lg"
              loading={submitting}
            />
          </>
        )}

        {/* ── STEP: PIX ── */}
        {step === 'pix' && qrCode && (
          <>
            {paymentFailed && (
              <InfoBox
                type="error"
                title="Pagamento não concluído"
                message="O pagamento foi cancelado ou rejeitado. Tente novamente."
              />
            )}

            <View style={styles.card}>
              <PixQRCard qrCodeBase64={qrCode.base64} qrCodeText={qrCode.text} />
            </View>

            <InfoBox type="info" message="Aguardando confirmação do pagamento PIX..." />

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[3], gap: Spacing[1] },
  backWrap: { paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing[4] },
  back: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[500] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing[10] },
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  profileRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.neutral[200] },
  profileInfo: { flex: 1, gap: Spacing[2] },
  providerName: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    backgroundColor: Colors.brand[50],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.brand[200],
  },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.brand[700] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center', gap: 2 },
  metaValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.neutral[800] },
  metaLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  unavailableNote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700] },
  input: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: Spacing[3],
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  textArea: {
    height: 100,
    paddingTop: Spacing[3],
  },
  row: { flexDirection: 'row', gap: Spacing[3] },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  priceValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.brand[500] },
  priceNote: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
});
