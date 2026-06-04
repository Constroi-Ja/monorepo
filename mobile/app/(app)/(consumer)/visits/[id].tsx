import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { visitsApi } from '@/api/visits';
import { TechnicalVisitRequest } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/shared/Button';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { InfoBox } from '@/components/shared/InfoBox';
import { useVisitMessages } from '@/hooks/useVisitMessages';
import { formatDateTime, formatDateOnly } from '@/utils/date';

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [visit, setVisit] = useState<TechnicalVisitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const { messages, sendMessage, loadInitial } = useVisitMessages(
    visit ? visit.id : null
  );

  const load = async () => {
    const { data } = await visitsApi.getById(Number(id));
    if (data) {
      setVisit(data);
      await loadInitial();
    }
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
    Alert.alert('Cancelar visita', 'Tem certeza que deseja cancelar esta visita?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar visita',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          await visitsApi.cancel(Number(id));
          await load();
          setCancelling(false);
        },
      },
    ]);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');
    await sendMessage(text);
  };

  if (loading) return <LoadingScreen />;
  if (!visit) return (
    <View style={styles.root}>
      <InfoBox type="error" message="Visita não encontrada." style={{ margin: 16 }} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Visita com {visit.provider_name}</Text>
          <StatusBadge status={visit.status} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
      >
        {/* Visit Info */}
        <View style={styles.section}>
          <InfoRow label="Endereço" value={visit.address} />
          {visit.preferred_date && <InfoRow label="Data preferencial" value={formatDateOnly(visit.preferred_date)} />}
          {visit.notes && <InfoRow label="Anotações" value={visit.notes} />}
        </View>

        {/* Cancel */}
        {(visit.status === 'pending' || visit.status === 'accepted') && (
          <Button
            onPress={handleCancel}
            label="Cancelar visita"
            variant="destructive"
            loading={cancelling}
          />
        )}

        {/* Chat */}
        {(visit.status === 'accepted' || visit.status === 'completed') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conversa com prestador</Text>
            {messages.length === 0 ? (
              <Text style={styles.noMessages}>Nenhuma mensagem ainda.</Text>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.bubble,
                    msg.sender_name === 'Você' ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  <Text style={[styles.bubbleText, msg.sender_name === 'Você' && styles.bubbleTextRight]}>
                    {msg.content}
                  </Text>
                  <Text style={styles.bubbleTime}>{formatDateTime(msg.created_at)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Message input */}
      {(visit.status === 'accepted' || visit.status === 'completed') && (
        <View style={[styles.messageBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={Colors.neutral[400]}
            multiline
          />
          <Pressable onPress={handleSend} style={styles.sendButton} hitSlop={8}>
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      )}
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
  row: { gap: 2 },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.neutral[500] },
  value: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[800] },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[3], gap: Spacing[2] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  back: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[500] },
  title: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing[6] },
  section: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[900] },
  noMessages: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[400], textAlign: 'center' },
  bubble: { maxWidth: '80%', borderRadius: Radius.lg, padding: Spacing[3], gap: 4 },
  bubbleLeft: { backgroundColor: Colors.neutral[100], alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleRight: { backgroundColor: Colors.brand[500], alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[800] },
  bubbleTextRight: { color: Colors.neutral[0] },
  bubbleTime: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[400] },
  messageBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[2],
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    gap: Spacing[2],
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
    backgroundColor: Colors.neutral[50],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, color: Colors.neutral[0] },
});
