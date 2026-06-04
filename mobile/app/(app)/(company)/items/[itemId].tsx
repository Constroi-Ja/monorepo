import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { companyApi } from '@/api/company';
import { StoreItem } from '@/types';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { useUiStore } from '@/store/uiStore';
import { AppIcon } from '@/components/shared/AppIcon';

const SHIPPING_TYPES = ['leve', 'medio', 'meio-pesado', 'pesado'];

export default function ItemFormScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const isNew = itemId === 'new';
  const insets = useSafeAreaInsets();
  const addToast = useUiStore((s) => s.addToast);

  const [item, setItem] = useState<Partial<StoreItem> & { is_available?: boolean }>({
    name: '', marca: '', description: '', price: '0', shipping_type: 'leve', peso: undefined, is_available: true,
  });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      companyApi.getItems().then(({ data }) => {
        const found = data?.find((i) => i.id === Number(itemId));
        if (found) { setItem(found); setPhotoUri(found.photo_url ?? null); }
      }).finally(() => setLoading(false));
    }
  }, []);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(item).forEach(([k, v]) => { if (v !== undefined) fd.append(k, String(v)); });
      if (photoUri && photoUri !== item.photo_url) {
        fd.append('photo', { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      }
      if (isNew) {
        await companyApi.createItem(fd);
        addToast('Produto criado!');
      } else {
        await companyApi.updateItem(Number(itemId), fd);
        addToast('Produto atualizado!');
      }
      router.back();
    } catch { addToast('Erro ao salvar.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>{isNew ? 'Novo produto' : 'Editar produto'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <Pressable onPress={pickPhoto} style={styles.photoArea}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <AppIcon name="camera" size={28} color={Colors.neutral[400]} />
              <Text style={styles.photoPlaceholderText}>Adicionar foto</Text>
            </View>
          )}
        </Pressable>

        <Input label="Nome" value={item.name} onChangeText={(v) => setItem((p) => ({ ...p, name: v }))} />
        <Input label="Marca" value={item.marca} onChangeText={(v) => setItem((p) => ({ ...p, marca: v }))} />
        <Input label="Descrição" value={item.description} onChangeText={(v) => setItem((p) => ({ ...p, description: v }))} multiline />
        <Input label="Preço (R$)" value={item.price} onChangeText={(v) => setItem((p) => ({ ...p, price: v }))} keyboardType="decimal-pad" />
        <Input label="Peso (kg)" value={item.peso ? String(item.peso) : ''} onChangeText={(v) => setItem((p) => ({ ...p, peso: Number(v) }))} keyboardType="decimal-pad" />

        <Text style={styles.label}>Tipo de frete</Text>
        <View style={styles.shippingRow}>
          {SHIPPING_TYPES.map((t) => (
            <Pressable key={t} onPress={() => setItem((p) => ({ ...p, shipping_type: t as any }))} style={[styles.shippingBtn, item.shipping_type === t && styles.shippingBtnActive]}>
              <Text style={[styles.shippingText, item.shipping_type === t && styles.shippingTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Disponível para venda</Text>
          <Switch value={item.is_available} onValueChange={(v) => setItem((p) => ({ ...p, is_available: v }))} trackColor={{ false: Colors.neutral[200], true: Colors.brand[400] }} thumbColor={item.is_available ? Colors.brand[500] : Colors.neutral[400]} />
        </View>

        <Button onPress={handleSave} label="Salvar produto" loading={saving} size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[3], gap: Spacing[2] },
  back: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[500] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing[10] },
  photoArea: { height: 200, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.neutral[200], borderStyle: 'dashed', backgroundColor: Colors.neutral[50], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%', borderRadius: Radius.xl },
  photoPlaceholder: { alignItems: 'center', gap: Spacing[2] },
  photoPlaceholderText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.neutral[400] },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700] },
  shippingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  shippingBtn: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1, borderColor: Colors.neutral[200] },
  shippingBtnActive: { backgroundColor: Colors.brand[50], borderColor: Colors.brand[400] },
  shippingText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  shippingTextActive: { color: Colors.brand[600] },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.neutral[800] },
});
