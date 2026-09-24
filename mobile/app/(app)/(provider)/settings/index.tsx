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
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaskInput from 'react-native-mask-input';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { authApi } from '@/api/auth';
import { useCEP } from '@/hooks/useCEP';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';

type Section = 'pessoal' | 'endereco' | 'atuacao' | 'seguranca';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'atuacao', label: 'Atuação' },
  { id: 'seguranca', label: 'Segurança' },
];

const GENDERS = [
  { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' }, { value: 'P', label: 'Prefiro não informar' },
];

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const SPECIALTIES = [
  { value: 'eletricista', label: 'Eletricista' },
  { value: 'pedreiro', label: 'Pedreiro' },
  { value: 'vidraceiro', label: 'Vidraceiro' },
  { value: 'pintor', label: 'Pintor' },
  { value: 'encanador', label: 'Encanador' },
  { value: 'carpinteiro', label: 'Carpinteiro' },
  { value: 'serralheiro', label: 'Serralheiro' },
  { value: 'gesseiro', label: 'Gesseiro' },
];

function normalizeSpecialties(raw: string[] | null | undefined): string[] {
  if (!raw || raw.length === 0) return [];
  return raw.flatMap((s) => {
    try { const p = JSON.parse(s); return Array.isArray(p) ? p : [s]; } catch { return [s]; }
  });
}

export default function ProviderSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { fetchCEP } = useCEP();
  const profile = user?.provider_profile;

  const [section, setSection] = useState<Section>('pessoal');
  const [saving, setSaving] = useState(false);

  // Personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');

  // Address
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Atuação
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [coverageRadius, setCoverageRadius] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [criminalRecordName, setCriminalRecordName] = useState('');
  const [criminalRecordFile, setCriminalRecordFile] = useState<any>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user && profile) {
      setFullName(profile.full_name ?? '');
      setEmail(user.email ?? '');
      setCpf(profile.cpf ?? '');
      setCnpj(profile.cnpj ?? '');
      setPhone(profile.phone ?? '');
      setBirthDate((profile as any).birth_date ?? '');
      setGender(profile.gender ?? '');
      setCep(profile.cep ?? '');
      setStreet(profile.street ?? '');
      setNumber(profile.number ?? '');
      setComplement(profile.complement ?? '');
      setCity(profile.city ?? '');
      setState(profile.state ?? '');
      setSelectedSpecialties(normalizeSpecialties(profile.specialties));
      setCoverageRadius(String(profile.coverage_radius_km ?? ''));
      setIsAvailable(profile.is_available);
      if (profile.criminal_record_url) setCriminalRecordName('Documento enviado');
    }
  }, [user]);

  const toggleSpecialty = (v: string) =>
    setSelectedSpecialties((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const handleCEP = async (raw: string) => {
    if (raw.length === 8) {
      const data = await fetchCEP(raw);
      if (data) { setStreet(data.logradouro); setCity(data.localidade); setState(data.uf); }
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const fd = new FormData();
      fd.append('profile_photo', { uri: result.assets[0].uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      await authApi.updateProfile(fd);
      await refreshUser();
      addToast('Foto atualizada!');
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled && result.assets[0]) {
      setCriminalRecordFile(result.assets[0]);
      setCriminalRecordName(result.assets[0].name);
    }
  };

  const savePersonal = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('full_name', fullName);
      fd.append('email', email);
      fd.append('cpf', cpf.replace(/\D/g, ''));
      if (cnpj) fd.append('cnpj', cnpj.replace(/\D/g, ''));
      fd.append('phone', phone.replace(/\D/g, ''));
      fd.append('gender', gender);
      if (birthDate) fd.append('birth_date', birthDate);
      await authApi.updateProviderProfile(fd);
      await refreshUser();
      addToast('Dados pessoais salvos!');
    } catch (e: any) { addToast(e.message ?? 'Erro.', 'error'); }
    finally { setSaving(false); }
  };

  const saveAddress = async () => {
    setSaving(true);
    try {
      await authApi.updateProviderProfile({ cep: cep.replace(/\D/g,''), street, number, complement, city, state });
      await refreshUser();
      addToast('Endereço salvo!');
    } catch (e: any) { addToast(e.message ?? 'Erro.', 'error'); }
    finally { setSaving(false); }
  };

  const saveAtuacao = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      selectedSpecialties.forEach((s) => fd.append('specialties', s));
      if (coverageRadius) fd.append('coverage_radius_km', coverageRadius);
      fd.append('is_available', String(isAvailable));
      if (criminalRecordFile) {
        fd.append('criminal_record', { uri: criminalRecordFile.uri, name: criminalRecordFile.name, type: criminalRecordFile.mimeType ?? 'application/pdf' } as any);
      }
      await authApi.updateProviderProfile(fd);
      await refreshUser();
      addToast('Atuação salva!');
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
      <Text style={styles.title}>Meu Perfil</Text>

      <View style={styles.avatarSection}>
        <Pressable onPress={pickPhoto} style={styles.avatarWrapper}>
          <Image source={user?.profile_photo_url ? { uri: user.profile_photo_url } : require('@/assets/placeholder-avatar.png')} style={styles.avatar} />
          <View style={styles.avatarBadge}><Text>📷</Text></View>
        </Pressable>
        <View style={styles.avatarMeta}>
          <Text style={styles.avatarName}>{profile?.full_name ?? `${user?.first_name} ${user?.last_name}`}</Text>
          <Text style={styles.avatarEmail}>{user?.email}</Text>
          {profile?.verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verificado</Text></View>}
        </View>
      </View>

      <View style={styles.tabs}>
        {SECTIONS.map((s) => (
          <Pressable key={s.id} onPress={() => setSection(s.id)} style={[styles.tab, section === s.id && styles.tabActive]}>
            <Text style={[styles.tabText, section === s.id && styles.tabTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {section === 'pessoal' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados pessoais</Text>
          <Input label="Nome completo" value={fullName} onChangeText={setFullName} />
          <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <View><Text style={styles.fl}>CPF</Text><MaskInput value={cpf} onChangeText={(_, r) => setCpf(r)} mask={[/\d/,/\d/,/\d/,'.',/\d/,/\d/,/\d/,'.',/\d/,/\d/,/\d/,'-',/\d/,/\d/]} style={styles.mi} placeholder="000.000.000-00" keyboardType="numeric" /></View>
          <View><Text style={styles.fl}>CNPJ (opcional)</Text><MaskInput value={cnpj} onChangeText={(_, r) => setCnpj(r)} mask={[/\d/,/\d/,'.',/\d/,/\d/,/\d/,'.',/\d/,/\d/,/\d/,'/',/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/]} style={styles.mi} placeholder="00.000.000/0000-00" keyboardType="numeric" /></View>
          <View><Text style={styles.fl}>Telefone</Text><MaskInput value={phone} onChangeText={(_, r) => setPhone(r)} mask={['(',/\d/,/\d/,')',' ',/\d/,/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/,/\d/,/\d/]} style={styles.mi} placeholder="(00) 00000-0000" keyboardType="phone-pad" /></View>
          <View><Text style={styles.fl}>Data de nascimento</Text><MaskInput value={birthDate} onChangeText={setBirthDate} mask={[/\d/,/\d/,'/',/\d/,/\d/,'/',/\d/,/\d/,/\d/,/\d/]} style={styles.mi} placeholder="DD/MM/AAAA" keyboardType="numeric" /></View>
          <View>
            <Text style={styles.fl}>Gênero</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => <Pressable key={g.value} onPress={() => setGender(g.value)} style={[styles.chip, gender === g.value && styles.chipActive]}><Text style={[styles.chipText, gender === g.value && styles.chipTextActive]}>{g.label}</Text></Pressable>)}
            </View>
          </View>
          <Button onPress={savePersonal} label="Salvar dados pessoais" loading={saving} />
        </View>
      )}

      {section === 'endereco' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Endereço</Text>
          <View><Text style={styles.fl}>CEP</Text><MaskInput value={cep} onChangeText={(m, r) => { setCep(m); handleCEP(r); }} mask={[/\d/,/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/,/\d/]} style={styles.mi} placeholder="00000-000" keyboardType="numeric" /></View>
          <Input label="Rua / Logradouro" value={street} onChangeText={setStreet} />
          <View style={styles.row}>
            <Input label="Número" value={number} onChangeText={setNumber} keyboardType="numeric" containerStyle={{ width: 90 }} />
            <Input label="Complemento" value={complement} onChangeText={setComplement} containerStyle={{ flex: 1 }} placeholder="Apto..." />
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

      {section === 'atuacao' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Atuação profissional</Text>

          <View style={styles.availRow}>
            <Text style={styles.availLabel}>Disponível para visitas</Text>
            <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: Colors.neutral[200], true: Colors.brand[400] }} thumbColor={isAvailable ? Colors.brand[500] : Colors.neutral[400]} />
          </View>

          <View>
            <Text style={styles.fl}>Especialidades</Text>
            <View style={styles.chipRow}>
              {SPECIALTIES.map((s) => (
                <Pressable key={s.value} onPress={() => toggleSpecialty(s.value)} style={[styles.chip, selectedSpecialties.includes(s.value) && styles.chipActive]}>
                  <Text style={[styles.chipText, selectedSpecialties.includes(s.value) && styles.chipTextActive]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Input label="Raio de cobertura (km)" value={coverageRadius} onChangeText={setCoverageRadius} keyboardType="numeric" />

          <View>
            <Text style={styles.fl}>Antecedentes criminais</Text>
            <Pressable onPress={pickDocument} style={styles.docBtn}>
              <Text style={styles.docText}>{criminalRecordName || '📎 Enviar documento (PDF ou foto)'}</Text>
            </Pressable>
          </View>

          <Button onPress={saveAtuacao} label="Salvar atuação" loading={saving} />
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

      <Button onPress={() => Alert.alert('Sair', 'Deseja realmente sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: logout }])} label="Sair da conta" variant="destructive" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing.tabBarSafeBuffer + 20 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.neutral[200] },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center' },
  avatarMeta: { flex: 1, gap: 3 },
  avatarName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[900] },
  avatarEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  verifiedBadge: { backgroundColor: Colors.success.light, borderRadius: Radius.full, paddingHorizontal: Spacing[2], paddingVertical: 3, alignSelf: 'flex-start' },
  verifiedText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.success.dark },
  tabs: { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: Radius.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.neutral[0] },
  tabText: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.neutral[500] },
  tabTextActive: { color: Colors.brand[600], fontFamily: FontFamily.semiBold },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[4] },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  fl: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700], marginBottom: 6 },
  mi: { height: 52, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[0], paddingHorizontal: Spacing[3], fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[900] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.neutral[200] },
  chipActive: { backgroundColor: Colors.brand[50], borderColor: Colors.brand[500] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  chipTextActive: { color: Colors.brand[600] },
  row: { flexDirection: 'row', gap: Spacing[3] },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stateBtn: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: Colors.neutral[200], minWidth: 38, alignItems: 'center' },
  stateBtnActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  stateText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.neutral[600] },
  stateTextActive: { color: Colors.neutral[0] },
  availRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.neutral[800] },
  docBtn: { borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.neutral[200], borderStyle: 'dashed', padding: Spacing[4], alignItems: 'center' },
  docText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
});
