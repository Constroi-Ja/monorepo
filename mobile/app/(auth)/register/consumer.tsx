import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { ProgressIndicator } from '@/components/shared/ProgressIndicator';
import { InfoBox } from '@/components/shared/InfoBox';
import { authApi } from '@/api/auth';
import { useCEP } from '@/hooks/useCEP';
import MaskInput from 'react-native-mask-input';

const step1Schema = z.object({
  first_name: z.string().min(2, 'Nome muito curto'),
  last_name: z.string().min(2, 'Sobrenome muito curto'),
  cpf: z.string().min(11, 'CPF inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  birth_date: z.string().min(8, 'Data inválida'),
  gender: z.string().min(1, 'Selecione o gênero'),
});

const step2Schema = z.object({
  cep: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3, 'Endereço obrigatório'),
  number: z.string().min(1, 'Número obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().min(2, 'Estado obrigatório'),
});

const step3Schema = z.object({
  email: z.string().email('E-mail inválido'),
  username: z.string().min(3, 'Usuário muito curto'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Senhas não conferem',
  path: ['password_confirm'],
});

const STEPS = ['Dados pessoais', 'Endereço', 'Acesso'];

export default function RegisterConsumerScreen() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { fetchCEP, loading: cepLoading } = useCEP();

  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });
  const form3 = useForm({ resolver: zodResolver(step3Schema) });

  const handleStep1 = form1.handleSubmit((data) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    setStep(1);
  });

  const handleCEP = async (cep: string) => {
    const data = await fetchCEP(cep);
    if (data) {
      form2.setValue('street', data.logradouro);
      form2.setValue('city', data.localidade);
      form2.setValue('state', data.uf);
    }
  };

  const handleStep2 = form2.handleSubmit((data) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    setStep(2);
  });

  const handleStep3 = form3.handleSubmit(async (data) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        ...data,
        user_type: 'consumer',
      };
      await authApi.registerConsumer(payload);
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
        <Text style={styles.title}>Cadastro — Consumidor</Text>
        <ProgressIndicator steps={STEPS} currentStep={step} />
      </View>

      <View style={styles.card}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <InfoBox type="error" message={error} /> : null}

        {step === 0 && (
          <View style={styles.form}>
            <Controller control={form1.control} name="first_name" render={({ field, fieldState }) => (
              <Input label="Nome" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="João" />
            )} />
            <Controller control={form1.control} name="last_name" render={({ field, fieldState }) => (
              <Input label="Sobrenome" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="Silva" />
            )} />
            <Controller control={form1.control} name="cpf" render={({ field, fieldState }) => (
              <View>
                <Text style={styles.label}>CPF</Text>
                <MaskInput
                  value={field.value}
                  onChangeText={(_, unmasked) => field.onChange(unmasked)}
                  mask={[/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/]}
                  style={styles.maskInput}
                  placeholder="000.000.000-00"
                  keyboardType="numeric"
                />
                {fieldState.error && <Text style={styles.fieldError}>{fieldState.error.message}</Text>}
              </View>
            )} />
            <Controller control={form1.control} name="phone" render={({ field, fieldState }) => (
              <View>
                <Text style={styles.label}>Telefone</Text>
                <MaskInput
                  value={field.value}
                  onChangeText={(_, unmasked) => field.onChange(unmasked)}
                  mask={['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
                  style={styles.maskInput}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                />
                {fieldState.error && <Text style={styles.fieldError}>{fieldState.error.message}</Text>}
              </View>
            )} />
            <Controller control={form1.control} name="birth_date" render={({ field, fieldState }) => (
              <View>
                <Text style={styles.label}>Data de nascimento</Text>
                <MaskInput
                  value={field.value}
                  onChangeText={field.onChange}
                  mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
                  style={styles.maskInput}
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                />
                {fieldState.error && <Text style={styles.fieldError}>{fieldState.error.message}</Text>}
              </View>
            )} />
            <Controller control={form1.control} name="gender" render={({ field, fieldState }) => (
              <Input label="Gênero" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="Masculino / Feminino / Outro" />
            )} />
            <Button onPress={handleStep1} label="Próximo" size="lg" />
          </View>
        )}

        {step === 1 && (
          <View style={styles.form}>
            <Controller control={form2.control} name="cep" render={({ field, fieldState }) => (
              <View>
                <Text style={styles.label}>CEP</Text>
                <MaskInput
                  value={field.value}
                  onChangeText={(masked, unmasked) => {
                    field.onChange(unmasked);
                    if (unmasked.length === 8) handleCEP(unmasked);
                  }}
                  mask={[/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/]}
                  style={styles.maskInput}
                  placeholder="00000-000"
                  keyboardType="numeric"
                />
                {fieldState.error && <Text style={styles.fieldError}>{fieldState.error.message}</Text>}
              </View>
            )} />
            <Controller control={form2.control} name="street" render={({ field, fieldState }) => (
              <Input label="Rua" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
            )} />
            <Controller control={form2.control} name="number" render={({ field, fieldState }) => (
              <Input label="Número" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />
            )} />
            <Controller control={form2.control} name="city" render={({ field, fieldState }) => (
              <Input label="Cidade" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
            )} />
            <Controller control={form2.control} name="state" render={({ field, fieldState }) => (
              <Input label="Estado (UF)" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} maxLength={2} autoCapitalize="characters" />
            )} />
            <View style={styles.row}>
              <Button onPress={() => setStep(0)} label="Voltar" variant="outline" style={{ flex: 1 }} />
              <Button onPress={handleStep2} label="Próximo" style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <Controller control={form3.control} name="email" render={({ field, fieldState }) => (
              <Input label="E-mail" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="email-address" autoCapitalize="none" />
            )} />
            <Controller control={form3.control} name="username" render={({ field, fieldState }) => (
              <Input label="Usuário" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} autoCapitalize="none" />
            )} />
            <Controller control={form3.control} name="password" render={({ field, fieldState }) => (
              <Input label="Senha" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} secureTextEntry placeholder="Mínimo 8 caracteres" />
            )} />
            <Controller control={form3.control} name="password_confirm" render={({ field, fieldState }) => (
              <Input label="Confirmar senha" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} secureTextEntry />
            )} />
            <View style={styles.row}>
              <Button onPress={() => setStep(1)} label="Voltar" variant="outline" style={{ flex: 1 }} />
              <Button onPress={handleStep3} label="Criar conta" loading={loading} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing[4],
    gap: Spacing[4],
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.neutral[0],
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  content: { padding: Spacing.screenHorizontal, paddingBottom: Spacing[10] },
  form: { gap: Spacing[4] },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.neutral[700],
    marginBottom: 6,
  },
  maskInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: 16,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  fieldError: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.error.base,
    marginTop: 4,
  },
  row: { flexDirection: 'row', gap: Spacing[3] },
});
