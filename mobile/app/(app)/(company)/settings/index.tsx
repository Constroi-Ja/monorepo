import React, { useState, useEffect } from 'react';
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
import MaskInput from 'react-native-mask-input';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { authApi } from '@/api/auth';
import { useCEP } from '@/hooks/useCEP';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';

type Section = 'empresa' | 'endereco' | 'horarios' | 'pix' | 'seguranca';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'horarios', label: 'Horários' },
  { id: 'pix', label: 'PIX' },
  { id: 'seguranca', label: 'Senha' },
];

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Aleatória' },
];

const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function CompanySettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { fetchCEP } = useCEP();
  const profile = user?.company_profile;

  const [section, setSection] = useState<Section>('empresa');
  const [saving, setSaving] = useState(false);

  // Company
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segment, setSegment] = useState('');
  const [phone, setPhone] = useState('');
  const [avgMinPerKm, setAvgMinPerKm] = useState('');
  const [displayRadius, setDisplayRadius] = useState('');

  // Address
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Hours — { day: boolean, open: string, close: string }[]
  const [hours, setHours] = useState<{ active: boolean; open: string; close: string }[]>(
    DAYS.map(() => ({ active: false, open: '08:00', close: '18:00' }))
  );

  // PIX
  const [pixKeyType, setPixKeyType] = useState('');
  const [pixKey, setPixKey] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user && profile) {
      setCompanyName(profile.company_name ?? '');
      setCnpj(profile.cnpj ?? '');
      setSegment(profile.segment ?? '');
      setPhone(profile.phone ?? '');
      setAvgMinPerKm(String(profile.avg_minutes_per_km ?? ''));
      setDisplayRadius(String(profile.display_radius_km ?? ''));
      setCep(profile.cep ?? '');
      setStreet(profile.street ?? '');
      setNumber(profile.number ?? '');
      setComplement(profile.complement ?? '');
      setCity(profile.city ?? '');
      setState(profile.state ?? '');
      setPixKeyType(profile.pix_key_type ?? '');
      setPixKey(profile.pix_key ?? '');
      if (profile.opening_time && profile.closing_time) {
        setHours((prev) => prev.map(() => ({ active: true, open: profile.opening_time!, close: profile.closing_time! })));
      }
    }
  }, [user]);

  const handleCEP = async (raw: string) => {
    if (raw.length === 8) {
      const data = await fetchCEP(raw);
      if (data) { setStreet(data.logradouro); setCity(data.localidade); setState(data.uf); }
    }
  };

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

  const updateHour = (i: number, field: 'active' | 'open' | 'close', value: any) =>
    setHours((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));

  const saveEmpresa = async () => {
    setSaving(true);
    try {
      await authApi.updateCompanyProfile({
        company_name: companyName,
        cnpj: cnpj.replace(/\D/g, ''),
        segment,
        phone: phone.replace(/\D/g, ''),
        avg_minutes_per_km: Number(avgMinPerKm),
        display_radius_km: Number(displayRadius),
      });
      await refreshUser();
      addToast('Dados da empresa salvos!');
    } catch (e: any) { addToast(e.message ?? 'Erro.', 'error'); }
    finally { setSaving(false); }
  };

  const saveAddress = async () => {
    setSaving(true);
    try {
      await authApi.updateCompanyProfile({ cep: cep.replace(/\D/g,''), street, number, complement, city, state });
      await refreshUser();
      addToast('Endereço salvo!');
    } catch (e: any) { addToast(e.message ?? 'Erro.', 'error'); }
    finally { setSaving(false); }
  };

  const saveHours = async () => {
    setSaving(true);
    try {
      const active = hours.find((h) => h.active);
      await authApi.updateCompanyProfile({
        opening_time: active?.open ?? null,
        closing_time: active?.close ?? null,
      });
      await refreshUser();
      addToast('Horários salvos!');
    } catch (e: any) { addToast(e.message ?? 'Erro.', 'error'); }
    finally { setSaving(false); }
  };

  const savePix = async () => {
    if (!pixKeyType || !pixKey) { addToast('Preencha o tipo e o valor da chave PIX.', 'error'); return; }
    setSaving(true);
    try {
      await authApi.updateCompanyProfile({ pix_key_type: pixKeyType, pix_key: pixKey });
      await refreshUser();
      addToast('Chave PIX salva!');
    } catch (e: any) { addToast(e.message ?? 'Erro.', 'error'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) { addToast('Senhas não conferem.', 'error'); return; }
    if (newPassword.length < 8) { addToast('Mínimo 8 caracteres.', 'error'); return; }
    setSaving(true);
    try {
      await authApi.updateProfile({ current_password: currentPassword, password: newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      addToast('Senha alterada!');
    } catch (e: any) { addToast(e.message ?? 'Erro.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Configurações</Text>

      {/* Logo */}
      <View style={styles.logoSection}>
        <Pressable onPress={pickLogo} style={styles.logoWrapper}>
          <Image source={profile?.logo_url ? { uri: profile.logo_url } : require('@/assets/placeholder-store.png')} style={styles.logo} />
          <View style={styles.logoBadge}><Text>📷</Text></View>
        </Pressable>
        <View>
          <Text style={styles.companyName}>{profile?.company_name}</Text>
          <Text style={styles.segment}>{profile?.segment}</Text>
        </View>
      </View>

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabs}>
          {SECTIONS.map((s) => (
            <Pressable key={s.id} onPress={() => setSection(s.id)} style={[styles.tab, section === s.id && styles.tabActive]}>
              <Text style={[styles.tabText, section === s.id && styles.tabTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {section === 'empresa' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados da empresa</Text>
          <Input label="Nome fantasia" value={companyName} onChangeText={setCompanyName} />
          <View><Text style={styles.fl}>CNPJ</Text><MaskInput value={cnpj} onChangeText={(_, r) => setCnpj(r)} mask={[/\d/,/\d/,'.',/\d/,/\d/,/\d/,'.',/\d/,/\d/,/\d/,'/',/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/]} style={styles.mi} placeholder="00.000.000/0000-00" keyboardType="numeric" /></View>
          <Input label="Segmento" value={segment} onChangeText={setSegment} placeholder="Materiais de construção..." />
          <View><Text style={styles.fl}>Telefone</Text><MaskInput value={phone} onChangeText={(_, r) => setPhone(r)} mask={['(',/\d/,/\d/,')',' ',/\d/,/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/,/\d/,/\d/]} style={styles.mi} placeholder="(00) 00000-0000" keyboardType="phone-pad" /></View>
          <Input label="Tempo médio de entrega (min/km)" value={avgMinPerKm} onChangeText={setAvgMinPerKm} keyboardType="numeric" />
          <Input label="Raio de exibição (km)" value={displayRadius} onChangeText={setDisplayRadius} keyboardType="numeric" />
          <Button onPress={saveEmpresa} label="Salvar empresa" loading={saving} />
        </View>
      )}

      {section === 'endereco' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Endereço</Text>
          <View><Text style={styles.fl}>CEP</Text><MaskInput value={cep} onChangeText={(_, r) => { setCep(r); handleCEP(r); }} mask={[/\d/,/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/,/\d/]} style={styles.mi} placeholder="00000-000" keyboardType="numeric" /></View>
          <Input label="Rua / Logradouro" value={street} onChangeText={setStreet} />
          <View style={styles.row}>
            <Input label="Número" value={number} onChangeText={setNumber} keyboardType="numeric" containerStyle={{ width: 90 }} />
            <Input label="Complemento" value={complement} onChangeText={setComplement} containerStyle={{ flex: 1 }} placeholder="Sala, Bloco..." />
          </View>
          <Input label="Cidade" value={city} onChangeText={setCity} />
          <View>
            <Text style={styles.fl}>Estado (UF)</Text>
            <View style={styles.stateRow}>
              {STATES.map((uf) => <Pressable key={uf} onPress={() => setState(uf)} style={[styles.stateBtn, state === uf && styles.stateBtnActive]}><Text style={[styles.stateText, state === uf && styles.stateTextActive]}>{uf}</Text></Pressable>)}
            </View>
          </View>
          <Button onPress={saveAddress} label="Salvar endereço" loading={saving} />
        </View>
      )}

      {section === 'horarios' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Horários de funcionamento</Text>
          {DAYS.map((day, i) => (
            <View key={day} style={styles.dayRow}>
              <Switch value={hours[i].active} onValueChange={(v) => updateHour(i, 'active', v)} trackColor={{ false: Colors.neutral[200], true: Colors.brand[400] }} thumbColor={hours[i].active ? Colors.brand[500] : Colors.neutral[400]} />
              <Text style={[styles.dayLabel, !hours[i].active && styles.dayLabelOff]}>{day}</Text>
              {hours[i].active && (
                <View style={styles.timeRow}>
                  <Input value={hours[i].open} onChangeText={(v) => updateHour(i, 'open', v)} containerStyle={styles.timeInput} placeholder="08:00" />
                  <Text style={styles.timeSep}>–</Text>
                  <Input value={hours[i].close} onChangeText={(v) => updateHour(i, 'close', v)} containerStyle={styles.timeInput} placeholder="18:00" />
                </View>
              )}
              {!hours[i].active && <Text style={styles.closedLabel}>Fechado</Text>}
            </View>
          ))}
          <Button onPress={saveHours} label="Salvar horários" loading={saving} />
        </View>
      )}

      {section === 'pix' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chave PIX para recebimento</Text>
          <View>
            <Text style={styles.fl}>Tipo de chave</Text>
            <View style={styles.chipRow}>
              {PIX_KEY_TYPES.map((t) => (
                <Pressable key={t.value} onPress={() => setPixKeyType(t.value)} style={[styles.chip, pixKeyType === t.value && styles.chipActive]}>
                  <Text style={[styles.chipText, pixKeyType === t.value && styles.chipTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Input label="Valor da chave PIX" value={pixKey} onChangeText={setPixKey} autoCapitalize="none" placeholder={pixKeyType === 'email' ? 'email@exemplo.com' : pixKeyType === 'cpf' ? '000.000.000-00' : 'Chave PIX'} />
          <Button onPress={savePix} label="Salvar chave PIX" loading={saving} />
        </View>
      )}

      {section === 'seguranca' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alterar senha</Text>
          <Input label="Senha atual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Input label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Mínimo 8 caracteres" />
          <Input label="Confirmar nova senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <Button onPress={savePassword} label="Alterar senha" loading={saving} />
        </View>
      )}

      <Button onPress={() => Alert.alert('Sair', 'Deseja sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: logout }])} label="Sair da conta" variant="destructive" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing.tabBarSafeBuffer + 20 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  logoSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  logoWrapper: { position: 'relative' },
  logo: { width: 80, height: 80, borderRadius: Radius.lg, backgroundColor: Colors.neutral[200] },
  logoBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  companyName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  segment: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  tabs: { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: Radius.lg, padding: 4, gap: 2 },
  tab: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.neutral[0] },
  tabText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
  tabTextActive: { color: Colors.brand[600], fontFamily: FontFamily.semiBold },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[4] },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  fl: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700], marginBottom: 6 },
  mi: { height: 52, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[0], paddingHorizontal: Spacing[3], fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[900] },
  row: { flexDirection: 'row', gap: Spacing[3] },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stateBtn: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: Colors.neutral[200], minWidth: 38, alignItems: 'center' },
  stateBtnActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  stateText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.neutral[600] },
  stateTextActive: { color: Colors.neutral[0] },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: 4 },
  dayLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.neutral[800], width: 30 },
  dayLabelOff: { color: Colors.neutral[400] },
  timeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  timeInput: { flex: 1 },
  timeSep: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.neutral[400] },
  closedLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[400] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.neutral[200] },
  chipActive: { backgroundColor: Colors.brand[50], borderColor: Colors.brand[500] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  chipTextActive: { color: Colors.brand[600] },
});
