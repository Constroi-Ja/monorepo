import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { companyApi } from '@/api/company';
import { Deliverer } from '@/types';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppIcon } from '@/components/shared/AppIcon';
import { useUiStore } from '@/store/uiStore';

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('leve');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const load = async () => {
    const { data } = await companyApi.getDeliverers();
    if (data) setDeliverers(data);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const openForm = (d?: Deliverer) => {
    if (d) { setEditId(d.id); setName(d.name); setPhone(d.phone ?? ''); setLevel(d.level); }
    else { setEditId(null); setName(''); setPhone(''); setLevel('leve'); }
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await companyApi.updateDeliverer(editId, { name, phone, level });
        addToast('Entregador atualizado!');
      } else {
        await companyApi.createDeliverer({ name, phone, level });
        addToast('Entregador adicionado!');
      }
      setShowForm(false);
      await load();
    } catch { addToast('Erro.', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = (d: Deliverer) => {
    Alert.alert('Excluir entregador', `Excluir "${d.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await companyApi.deleteDeliverer(d.id); addToast('Excluído.'); await load(); } },
    ]);
  };

  const handleToggle = async (d: Deliverer) => {
    await companyApi.updateDeliverer(d.id, { is_available: !d.is_available });
    setDeliverers((prev) => prev.map((x) => x.id === d.id ? { ...x, is_available: !x.is_available } : x));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Entregadores</Text>
        <Pressable onPress={() => openForm()} style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      {deliverers.length === 0 && !loading ? (
        <EmptyState icon="delivery" title="Nenhum entregador" subtitle="Adicione entregadores à sua equipe." ctaLabel="Adicionar" onCta={() => openForm()} />
      ) : (
        <FlatList
          data={deliverers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardLevel}>{item.level_display}</Text>
                {item.phone && <Text style={styles.cardPhone}>{item.phone}</Text>}
              </View>
              <Switch value={item.is_available} onValueChange={() => handleToggle(item)} trackColor={{ false: Colors.neutral[200], true: Colors.brand[400] }} thumbColor={item.is_available ? Colors.brand[500] : Colors.neutral[400]} />
              <Pressable onPress={() => openForm(item)} hitSlop={8}>
                <AppIcon name="wrench" size={18} color={Colors.neutral[500]} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                <AppIcon name="trash" size={18} color={Colors.error.base} />
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>{editId ? 'Editar entregador' : 'Novo entregador'}</Text>
          <Input label="Nome" value={name} onChangeText={setName} />
          <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Text style={styles.label}>Nível</Text>
          <View style={styles.levelRow}>
            {['leve', 'medio', 'meio-pesado', 'pesado'].map((l) => (
              <Pressable key={l} onPress={() => setLevel(l)} style={[styles.levelBtn, level === l && styles.levelBtnActive]}>
                <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.actions}>
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
  list: { padding: Spacing.screenHorizontal, gap: Spacing[3], paddingBottom: Spacing[10] },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  cardLevel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  cardPhone: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  modal: { padding: Spacing[6], gap: Spacing[4] },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700] },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  levelBtn: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.neutral[200] },
  levelBtnActive: { backgroundColor: Colors.brand[50], borderColor: Colors.brand[400] },
  levelText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  levelTextActive: { color: Colors.brand[600] },
  actions: { flexDirection: 'row', gap: Spacing[3] },
});
