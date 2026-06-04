import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Switch,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { companyApi } from '@/api/company';
import { Bill } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { formatCurrency } from '@/utils/currency';
import { formatDateOnly } from '@/utils/date';
import { useUiStore } from '@/store/uiStore';

const CATEGORIES = ['Aluguel', 'Fornecedor', 'Imposto', 'Funcionário', 'Outros'];
type Filter = 'all' | 'pending' | 'paid';

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Outros');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = filter === 'pending' ? { is_paid: false } : filter === 'paid' ? { is_paid: true } : undefined;
    const { data } = await companyApi.getBills(params);
    if (data) setBills(data);
  }, [filter]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [filter]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTogglePaid = async (bill: Bill) => {
    await companyApi.updateBill(bill.id, { is_paid: !bill.is_paid });
    setBills((prev) => prev.map((b) => b.id === bill.id ? { ...b, is_paid: !b.is_paid } : b));
    addToast(`${bill.is_paid ? 'Marcado como pendente' : 'Marcado como pago'}!`);
  };

  const handleDelete = (bill: Bill) => {
    Alert.alert('Excluir conta', `Excluir "${bill.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await companyApi.deleteBill(bill.id); addToast('Excluída.'); await load(); } },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await companyApi.createBill({ description, amount, due_date: dueDate, category });
      addToast('Conta adicionada!');
      setShowForm(false);
      setDescription(''); setAmount(''); setDueDate(''); setCategory('Outros');
      await load();
    } catch { addToast('Erro ao salvar.', 'error'); }
    finally { setSaving(false); }
  };

  const today = new Date();
  const isOverdue = (bill: Bill) => !bill.is_paid && new Date(bill.due_date) < today;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Contas a Pagar</Text>
        <Pressable onPress={() => setShowForm(true)} style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {(['all', 'pending', 'paid'] as Filter[]).map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Pagas'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <LoadingScreen /> : bills.length === 0 ? (
        <EmptyState icon="credit-card" title="Nenhuma conta" subtitle="Registre suas contas a pagar aqui." ctaLabel="Adicionar" onCta={() => setShowForm(true)} />
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const overdue = isOverdue(item);
            return (
              <View style={[styles.card, overdue && styles.cardOverdue]}>
                <View style={styles.cardMain}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                    <Text style={[styles.cardDate, overdue && styles.cardDateOverdue]}>
                      Vence: {formatDateOnly(item.due_date)} {overdue ? '• Vencida' : ''}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
                    <Switch
                      value={item.is_paid}
                      onValueChange={() => handleTogglePaid(item)}
                      trackColor={{ false: Colors.neutral[200], true: Colors.success.base }}
                      thumbColor={item.is_paid ? Colors.success.dark : Colors.neutral[400]}
                    />
                  </View>
                </View>
                <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn} hitSlop={8}>
                  <Text style={styles.deleteText}>Excluir</Text>
                </Pressable>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>Nova conta</Text>
          <Input label="Descrição" value={description} onChangeText={setDescription} />
          <Input label="Valor (R$)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <Input label="Vencimento (AAAA-MM-DD)" value={dueDate} onChangeText={setDueDate} />
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Button onPress={() => setShowForm(false)} label="Cancelar" variant="outline" style={{ flex: 1 }} />
            <Button onPress={handleSave} label="Salvar" loading={saving} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing[4], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  fabText: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.neutral[0], lineHeight: 32 },
  filters: { flexDirection: 'row', marginHorizontal: Spacing.screenHorizontal, backgroundColor: Colors.neutral[100], borderRadius: Radius.lg, padding: 4, marginBottom: Spacing[3] },
  filterBtn: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  filterBtnActive: { backgroundColor: Colors.neutral[0] },
  filterText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
  filterTextActive: { color: Colors.neutral[900] },
  list: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing.tabBarSafeBuffer, gap: Spacing[3] },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[2] },
  cardOverdue: { borderWidth: 1, borderColor: Colors.error.base },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  cardInfo: { flex: 1, gap: 2 },
  cardDesc: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  cardCategory: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  cardDate: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  cardDateOverdue: { color: Colors.error.base },
  cardRight: { alignItems: 'flex-end', gap: Spacing[2] },
  cardAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.brand[500] },
  deleteBtn: { alignSelf: 'flex-end' },
  deleteText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.error.base },
  modal: { padding: Spacing[6], gap: Spacing[4] },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.neutral[200] },
  chipActive: { backgroundColor: Colors.brand[50], borderColor: Colors.brand[400] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  chipTextActive: { color: Colors.brand[600] },
  modalActions: { flexDirection: 'row', gap: Spacing[3] },
});
