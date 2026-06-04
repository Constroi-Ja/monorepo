import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { companyApi } from '@/api/company';
import { InventoryItem } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { AppIcon } from '@/components/shared/AppIcon';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { useUiStore } from '@/store/uiStore';

export default function CompanyInventoryScreen() {
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('un');
  const [minQty, setMinQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await companyApi.getInventory();
    if (data) setItems(data);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openForm = (item?: InventoryItem) => {
    if (item) {
      setEditItem(item);
      setName(item.name);
      setCategory(item.category);
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setMinQty(String(item.min_quantity));
      setPurchasePrice(item.purchase_price);
    } else {
      setEditItem(null);
      setName(''); setCategory(''); setQuantity(''); setUnit('un'); setMinQty(''); setPurchasePrice('');
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { name, category, quantity: Number(quantity), unit, min_quantity: Number(minQty), purchase_price: purchasePrice };
      if (editItem) {
        await companyApi.updateInventoryItem(editItem.id, data);
        addToast('Item atualizado!');
      } else {
        await companyApi.createInventoryItem(data);
        addToast('Item adicionado!');
      }
      setShowForm(false);
      await load();
    } catch { addToast('Erro ao salvar.', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert('Excluir item', `Excluir "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => { await companyApi.deleteInventoryItem(item.id); addToast('Excluído.'); await load(); },
      },
    ]);
  };

  const lowStockCount = items.filter((i) => i.quantity < i.min_quantity).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Estoque</Text>
          {lowStockCount > 0 && (
            <Text style={styles.alert}>{lowStockCount} item(s) abaixo do mínimo</Text>
          )}
        </View>
        <Pressable onPress={() => openForm()} style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      {loading ? <LoadingScreen /> : items.length === 0 ? (
        <EmptyState icon="filing-cabinet" title="Estoque vazio" subtitle="Adicione itens ao seu controle de estoque." ctaLabel="Adicionar" onCta={() => openForm()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const lowStock = item.quantity < item.min_quantity;
            return (
              <Pressable onPress={() => openForm(item)} style={[styles.card, lowStock && styles.cardLowStock]}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                </View>
                <View style={styles.cardQty}>
                  <Text style={[styles.qtyText, lowStock && styles.qtyLow]}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={styles.minQty}>mín: {item.min_quantity}</Text>
                </View>
                <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                  <AppIcon name="trash" size={20} color={Colors.error.base} />
                </Pressable>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>{editItem ? 'Editar item' : 'Novo item'}</Text>
          <Input label="Nome" value={name} onChangeText={setName} />
          <Input label="Categoria" value={category} onChangeText={setCategory} />
          <Input label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          <Input label="Unidade (un, kg, L...)" value={unit} onChangeText={setUnit} />
          <Input label="Quantidade mínima" value={minQty} onChangeText={setMinQty} keyboardType="numeric" />
          <Input label="Preço de compra (R$)" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" />
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
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing[4], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  alert: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.warning.dark },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  fabText: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.neutral[0], lineHeight: 32 },
  list: { padding: Spacing.screenHorizontal, paddingBottom: Spacing.tabBarSafeBuffer, gap: Spacing[3] },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3], ...Shadows.sm },
  cardLowStock: { borderWidth: 1, borderColor: Colors.warning.base },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  cardCategory: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  cardQty: { alignItems: 'flex-end' },
  qtyText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.neutral[800] },
  qtyLow: { color: Colors.error.base },
  minQty: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[400] },
  modal: { padding: Spacing[6], gap: Spacing[4] },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  modalActions: { flexDirection: 'row', gap: Spacing[3] },
});
