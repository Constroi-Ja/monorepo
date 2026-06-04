import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { InfoBox } from '@/components/shared/InfoBox';
import { authApi } from '@/api/auth';
import MaskInput from 'react-native-mask-input';

const schema = z.object({
  company_name: z.string().min(2),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  segment: z.string().min(2, 'Segmento obrigatório'),
  phone: z.string().min(10),
  email: z.string().email('E-mail inválido'),
  username: z.string().min(3),
  password: z.string().min(8),
  password_confirm: z.string(),
  cep: z.string().min(8),
  street: z.string().min(3),
  number: z.string().min(1),
  city: z.string().min(2),
  state: z.string().min(2),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Senhas não conferem',
  path: ['password_confirm'],
});

export default function RegisterCompanyScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setError('');
    try {
      await authApi.registerCompany({ ...data, user_type: 'company' });
      router.replace('/(auth)/register/success');
    } catch (e: any) {
      setError(e.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.neutral[900] }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Cadastro — Empresa</Text>
      </View>

      <View style={styles.card}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <InfoBox type="error" message={error} style={{ marginBottom: 16 }} /> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados da empresa</Text>
          <Controller control={control} name="company_name" render={({ field, fieldState }) => (
            <Input label="Nome da empresa" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )} />
          <Controller control={control} name="cnpj" render={({ field, fieldState }) => (
            <View>
              <Text style={styles.label}>CNPJ</Text>
              <MaskInput value={field.value} onChangeText={(_, u) => field.onChange(u)} mask={[/\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/]} style={styles.maskInput} placeholder="00.000.000/0000-00" keyboardType="numeric" />
              {fieldState.error && <Text style={styles.fieldError}>{fieldState.error.message}</Text>}
            </View>
          )} />
          <Controller control={control} name="segment" render={({ field, fieldState }) => (
            <Input label="Segmento" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="Materiais de construção, Ferragens..." />
          )} />
          <Controller control={control} name="phone" render={({ field, fieldState }) => (
            <View>
              <Text style={styles.label}>Telefone</Text>
              <MaskInput value={field.value} onChangeText={(_, u) => field.onChange(u)} mask={['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]} style={styles.maskInput} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
              {fieldState.error && <Text style={styles.fieldError}>{fieldState.error.message}</Text>}
            </View>
          )} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          <Controller control={control} name="cep" render={({ field, fieldState }) => (
            <View>
              <Text style={styles.label}>CEP</Text>
              <MaskInput value={field.value} onChangeText={(_, u) => field.onChange(u)} mask={[/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/]} style={styles.maskInput} placeholder="00000-000" keyboardType="numeric" />
              {fieldState.error && <Text style={styles.fieldError}>{fieldState.error.message}</Text>}
            </View>
          )} />
          <Controller control={control} name="street" render={({ field, fieldState }) => (
            <Input label="Rua" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )} />
          <Controller control={control} name="number" render={({ field, fieldState }) => (
            <Input label="Número" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />
          )} />
          <Controller control={control} name="city" render={({ field, fieldState }) => (
            <Input label="Cidade" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )} />
          <Controller control={control} name="state" render={({ field, fieldState }) => (
            <Input label="UF" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} maxLength={2} autoCapitalize="characters" />
          )} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso</Text>
          <Controller control={control} name="email" render={({ field, fieldState }) => (
            <Input label="E-mail" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="email-address" autoCapitalize="none" />
          )} />
          <Controller control={control} name="username" render={({ field, fieldState }) => (
            <Input label="Usuário" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} autoCapitalize="none" />
          )} />
          <Controller control={control} name="password" render={({ field, fieldState }) => (
            <Input label="Senha" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} secureTextEntry placeholder="Mínimo 8 caracteres" />
          )} />
          <Controller control={control} name="password_confirm" render={({ field, fieldState }) => (
            <Input label="Confirmar senha" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} secureTextEntry />
          )} />
        </View>

        <Button onPress={onSubmit} label="Criar conta" loading={loading} size="lg" />
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[4], gap: Spacing[2] },
  back: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[400] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0] },
  card: { flex: 1, backgroundColor: Colors.surface.background, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], overflow: 'hidden' },
  content: { padding: Spacing.screenHorizontal, paddingBottom: Spacing[10], gap: Spacing[6] },
  section: { gap: Spacing[3] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.neutral[800] },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[700], marginBottom: 6 },
  maskInput: { height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[0], paddingHorizontal: 16, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[900] },
  fieldError: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.error.base, marginTop: 4 },
});
