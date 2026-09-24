import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
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

type Section = 'pessoal' | 'endereco' | 'seguranca';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'seguranca', label: 'Segurança' },
];

const GENDERS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
  { value: 'P', label: 'Prefiro não informar' },
];

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function ConsumerSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { fetchCEP } = useCEP();
  const profile = user?.consumer_profile;

  const [section, setSection] = useState<Section>('pessoal');
  const [saving, setSaving] = useState(false);

  // Personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
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

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user && profile) {
      setFullName(profile.full_name ?? '');
      setEmail(user.email ?? '');
      setCpf(profile.cpf ?? '');
      setPhone(profile.phone ?? '');
      setBirthDate((profile as any).birth_date ?? '');
      setGender(profile.gender ?? '');
      setCep(profile.cep ?? '');
      setStreet(profile.street ?? '');
      setNumber(profile.number ?? '');
      setComplement(profile.complement ?? '');
      setCity(profile.city ?? '');
      setState(profile.state ?? '');
    }
  }, [user]);

  const handleCEP = async (raw: string) => {
    if (raw.length === 8) {
      const data = await fetchCEP(raw);
      if (data) {
        setStreet(data.logradouro);
        setCity(data.localidade);
        setState(data.uf);
      }
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const fd = new FormData();
      fd.append('profile_photo', { uri: result.assets[0].uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      await authApi.updateProfile(fd);
      await refreshUser();
      addToast('Foto atualizada!');
    }
  };

  const savePersonal = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('full_name', fullName);
      fd.append('email', email);
      fd.append('cpf', cpf.replace(/\D/g, ''));
      fd.append('phone', phone.replace(/\D/g, ''));
      fd.append('gender', gender);
      if (birthDate) fd.append('birth_date', birthDate);
      await authApi.updateConsumerProfile(fd);
      await refreshUser();
      addToast('Dados pessoais salvos!');
    } catch (e: any) {
      addToast(e.message ?? 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    setSaving(true);
    try {
      await authApi.updateConsumerProfile({ cep: cep.replace(/\D/g,''), street, number, complement, city, state });
      await refreshUser();
      addToast('Endereço salvo!');
    } catch (e: any) {
      addToast(e.message ?? 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast('Senhas não conferem.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Nova senha deve ter mínimo 8 caracteres.', 'error');
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({ current_password: currentPassword, password: newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      addToast('Senha alterada com sucesso!');
    } catch (e: any) {
      addToast(e.message ?? 'Erro ao alterar senha.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Meu Perfil</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Pressable onPress={pickPhoto} style={styles.avatarWrapper}>
          <Image
            source={user?.profile_photo_url ? { uri: user.profile_photo_url } : require('@/assets/placeholder-avatar.png')}
            style={styles.avatar}
          />
          <View style={styles.avatarBadge}><Text style={styles.avatarBadgeIcon}>📷</Text></View>
        </Pressable>
        <Text style={styles.avatarName}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.avatarEmail}>{user?.email}</Text>
      </View>

      {/* Section tabs */}
      <View style={styles.tabs}>
        {SECTIONS.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setSection(s.id)}
            style={[styles.tab, section === s.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, section === s.id && styles.tabTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Pessoal */}
      {section === 'pessoal' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados pessoais</Text>
          <Input label="Nome completo" value={fullName} onChangeText={setFullName} />
          <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <View>
            <Text style={styles.fieldLabel}>CPF</Text>
            <MaskInput
              value={cpf}
              onChangeText={(_, raw) => setCpf(raw)}
              mask={[/\d/,/\d/,/\d/,'.',/\d/,/\d/,/\d/,'.',/\d/,/\d/,/\d/,'-',/\d/,/\d/]}
              style={styles.maskInput}
              placeholder="000.000.000-00"
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Telefone</Text>
            <MaskInput
              value={phone}
              onChangeText={(_, raw) => setPhone(raw)}
              mask={['(',/\d/,/\d/,')',' ',/\d/,/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/,/\d/,/\d/]}
              style={styles.maskInput}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Data de nascimento</Text>
            <MaskInput
              value={birthDate}
              onChangeText={setBirthDate}
              mask={[/\d/,/\d/,'/',/\d/,/\d/,'/',/\d/,/\d/,/\d/,/\d/]}
              style={styles.maskInput}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Gênero</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g.value}
                  onPress={() => setGender(g.value)}
                  style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]}
                >
                  <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button onPress={savePersonal} label="Salvar dados pessoais" loading={saving} />
        </View>
      )}

      {/* Endereço */}
      {section === 'endereco' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Endereço</Text>

          <View>
            <Text style={styles.fieldLabel}>CEP</Text>
            <MaskInput
              value={cep}
              onChangeText={(masked, raw) => { setCep(masked); handleCEP(raw); }}
              mask={[/\d/,/\d/,/\d/,/\d/,/\d/,'-',/\d/,/\d/,/\d/]}
              style={styles.maskInput}
              placeholder="00000-000"
              keyboardType="numeric"
            />
          </View>

          <Input label="Rua / Logradouro" value={street} onChangeText={setStreet} />
          <View style={styles.row}>
            <Input label="Número" value={number} onChangeText={setNumber} keyboardType="numeric" containerStyle={styles.numberInput} />
            <Input label="Complemento" value={complement} onChangeText={setComplement} containerStyle={styles.complementInput} placeholder="Apto, Bloco..." />
          </View>
          <Input label="Cidade" value={city} onChangeText={setCity} />
          <View>
            <Text style={styles.fieldLabel}>Estado (UF)</Text>
            <View style={styles.stateRow}>
              {STATES.map((uf) => (
                <Pressable
                  key={uf}
                  onPress={() => setState(uf)}
                  style={[styles.stateBtn, state === uf && styles.stateBtnActive]}
                >
                  <Text style={[styles.stateText, state === uf && styles.stateTextActive]}>{uf}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button onPress={saveAddress} label="Salvar endereço" loading={saving} />
        </View>
      )}

      {/* Segurança */}
      {section === 'seguranca' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alterar senha</Text>
          <Input label="Senha atual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Input label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Mínimo 8 caracteres" />
          <Input label="Confirmar nova senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <Button onPress={savePassword} label="Alterar senha" loading={saving} />
        </View>
      )}

      <View style={styles.logoutSection}>
        <Button
          onPress={() => Alert.alert('Sair', 'Deseja realmente sair?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: logout },
          ])}
          label="Sair da conta"
          variant="destructive"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  content: { padding: Spacing.screenHorizontal, gap: Spacing[4], paddingBottom: Spacing.tabBarSafeBuffer + 20 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900] },
  avatarSection: { alignItems: 'center', gap: Spacing[2] },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.neutral[200] },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand[500], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.neutral[0] },
  avatarBadgeIcon: { fontSize: 14 },
  avatarName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.neutral[900] },
  avatarEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  tabs: { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: Radius.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.neutral[0], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  tabText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[500] },
  tabTextActive: { color: Colors.brand[600], fontFamily: FontFamily.semiBold },
  card: { backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, padding: Spacing[4], gap: Spacing[4] },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700], marginBottom: 6 },
  maskInput: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[3],
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  genderBtn: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.neutral[200] },
  genderBtnActive: { backgroundColor: Colors.brand[50], borderColor: Colors.brand[500] },
  genderText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[600] },
  genderTextActive: { color: Colors.brand[600] },
  row: { flexDirection: 'row', gap: Spacing[3] },
  numberInput: { width: 90 },
  complementInput: { flex: 1 },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stateBtn: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: Colors.neutral[200], minWidth: 38, alignItems: 'center' },
  stateBtnActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  stateText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.neutral[600] },
  stateTextActive: { color: Colors.neutral[0] },
  logoutSection: { marginTop: Spacing[2] },
});
