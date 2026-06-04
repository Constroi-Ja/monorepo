import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Image, Switch } from 'react-native';
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

export default function CompanySettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { isDark, toggleTheme, colors } = useTheme();
  const profile = user?.company_profile;

  const [companyName, setCompanyName] = useState(profile?.company_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [segment, setSegment] = useState(profile?.segment ?? '');
  const [pixKeyType, setPixKeyType] = useState(profile?.pix_key_type ?? '');
  const [pixKey, setPixKey] = useState(profile?.pix_key ?? '');
  const [saving, setSaving] = useState(false);

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const fd = new FormData();
      fd.append('logo', { uri: result.assets[0].uri, name: 'logo.jpg', type: 'image/jpeg' } as any);
      await authApi.updateCompanyProfile(fd);
      await refreshUser();
      addToast('Logo atualizada!');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateCompanyProfile({ company_name: companyName, phone, segment, pix_key_type: pixKeyType, pix_key: pixKey });
      await refreshUser();
      addToast('Empresa atualizada!');
    } catch { addToast('Erro ao salvar.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.logoSection}>
        <Pressable onPress={pickLogo}>
          <Image source={resolveMediaUrl(profile?.logo_url) ?? require('@/assets/placeholder-store.png')} style={styles.logo} />
          <View style={styles.logoBadge}><AppIcon name="camera" size={14} color={Colors.neutral[0]} /></View>
        </Pressable>
        <Text style={styles.companyName}>{profile?.company_name}</Text>
        <Text style={styles.segment}>{profile?.segment}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados da empresa</Text>
        <Input label="Nome fantasia" value={companyName} onChangeText={setCompanyName} />
        <Input label="Segmento" value={segment} onChangeText={setSegment} />
        <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chave PIX</Text>
        <Input label="Tipo (CPF/CNPJ/Email/Telefone/Aleatória)" value={pixKeyType} onChangeText={setPixKeyType} />
        <Input label="Chave PIX" value={pixKey} onChangeText={setPixKey} autoCapitalize="none" />
      </View>

      <Button onPress={handleSave} label="Salvar configurações" loading={saving} size="lg" />

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

      <Button onPress={() => Alert.alert('Sair', 'Deseja sair?', [{ text: 'Não', style: 'cancel' }, { text: 'Sim', onPress: logout }])} label="Sair da conta" variant="destructive" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[5], paddingBottom: Spacing.tabBarSafeBuffer },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  logoSection: { alignItems: 'center', gap: Spacing[2] },
  logo: { width: 96, height: 96, borderRadius: Radius.lg, backgroundColor: Colors.neutral[200] },
  logoBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  companyName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.neutral[900] },
  segment: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  section: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[4] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  themeLabel: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[700] },
});
