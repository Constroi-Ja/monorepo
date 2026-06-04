import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { authApi } from '@/api/auth';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { AppIcon } from '@/components/shared/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/utils/media';

export default function ProviderSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { isDark, toggleTheme, colors } = useTheme();
  const profile = user?.provider_profile;

  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [radius, setRadius] = useState(String(profile?.coverage_radius_km ?? ''));
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const formData = new FormData();
      formData.append('profile_photo', { uri: result.assets[0].uri, name: 'profile.jpg', type: 'image/jpeg' } as any);
      await authApi.updateProfile(formData);
      await refreshUser();
      addToast('Foto atualizada!');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProviderProfile({ full_name: name, phone, coverage_radius_km: Number(radius) });
      await refreshUser();
      addToast('Perfil atualizado!');
    } catch {
      addToast('Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.title}>Meu Perfil</Text>

      <View style={styles.avatarSection}>
        <Pressable onPress={pickPhoto}>
          <Image source={resolveMediaUrl(user?.profile_photo_url) ?? require('@/assets/placeholder-avatar.png')} style={styles.avatar} />
          <View style={styles.avatarBadge}><AppIcon name="camera" size={14} color={Colors.neutral[0]} /></View>
        </Pressable>
        <Text style={styles.avatarName}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.avatarEmail}>{user?.email}</Text>
        {profile?.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verificado</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados profissionais</Text>
        <Input label="Nome completo" value={name} onChangeText={setName} />
        <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Raio de cobertura (km)" value={radius} onChangeText={setRadius} keyboardType="numeric" />
        <Button onPress={handleSave} label="Salvar dados" loading={saving} />
      </View>

      <View style={styles.specialties}>
        <Text style={styles.sectionTitle}>Especialidades</Text>
        <View style={styles.chips}>
          {profile?.specialties.map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aparência</Text>
        <View style={styles.themeRow}>
          <AppIcon name={isDark ? 'moon' : 'sun'} size={20} color={Colors.brand[500]} />
          <Text style={styles.themeLabel}>Tema escuro</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: Colors.neutral[200], true: Colors.brand[400] }}
            thumbColor={isDark ? Colors.brand[500] : Colors.neutral[400]}
          />
        </View>
      </View>

      <Button onPress={handleLogout} label="Sair da conta" variant="destructive" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[6], paddingBottom: Spacing.tabBarSafeBuffer },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  avatarSection: { alignItems: 'center', gap: Spacing[2] },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.neutral[200] },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  themeLabel: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[700] },
  avatarName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.neutral[900] },
  avatarEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  verifiedBadge: { backgroundColor: Colors.success.light, borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 4 },
  verifiedText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.success.dark },
  section: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[4] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  specialties: { gap: Spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 6, backgroundColor: Colors.brand[50], borderWidth: 1, borderColor: Colors.brand[200] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.brand[700] },
});
