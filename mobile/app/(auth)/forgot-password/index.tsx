import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { InfoBox } from '@/components/shared/InfoBox';
import { AppIcon } from '@/components/shared/AppIcon';
import { authApi } from '@/api/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!email) { setError('Informe seu e-mail.'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹ Voltar</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <AppIcon name="key" size={56} color={Colors.brand[500]} />
          <Text style={styles.title}>Recuperar senha</Text>
        </View>

        {sent ? (
          <InfoBox
            type="success"
            title="E-mail enviado!"
            message="Verifique sua caixa de entrada e clique no link para redefinir sua senha."
          />
        ) : (
          <>
            <Text style={styles.subtitle}>
              Informe seu e-mail e enviaremos um link para redefinir a senha.
            </Text>
            {error ? <InfoBox type="error" message={error} /> : null}
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              placeholder="seu@email.com"
            />
            <Button onPress={handleSubmit} label="Enviar link" loading={loading} size="lg" />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background, paddingHorizontal: Spacing.screenHorizontal },
  back: { paddingVertical: Spacing[2] },
  backText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.brand[500] },
  content: { flex: 1, justifyContent: 'center', gap: Spacing[4] },
  header: { alignItems: 'center', gap: Spacing[3] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[900], textAlign: 'center' },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.neutral[500], textAlign: 'center', lineHeight: 24, alignSelf: 'stretch' },
});
