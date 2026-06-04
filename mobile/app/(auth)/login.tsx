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
import { useAuthStore } from '@/store/authStore';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { Logo } from '@/components/shared/Logo';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { InfoBox } from '@/components/shared/InfoBox';
import { AppIcon } from '@/components/shared/AppIcon';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading, user } = useAuthStore();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message || 'Credenciais inválidas.');
    }
  };

  React.useEffect(() => {
    if (user) {
      switch (user.user_type) {
        case 'consumer': router.replace('/(app)/(consumer)'); break;
        case 'provider': router.replace('/(app)/(provider)'); break;
        case 'company': router.replace('/(app)/(company)'); break;
        case 'admin': router.replace('/(app)/(admin)'); break;
      }
    }
  }, [user]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Logo size="lg" dark />
          <Text style={styles.subtitle}>Bem-vindo de volta</Text>
        </View>

        <View style={styles.card}>
          {error ? <InfoBox type="error" message={error} /> : null}

          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            placeholder="seu@email.com"
            variant="dark"
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            variant="dark"
            rightIcon={
              <AppIcon
                name={showPassword ? 'eye-closed' : 'eye-open'}
                size={20}
                color={Colors.neutral[400]}
              />
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
          </Pressable>

          <Button
            onPress={handleLogin}
            label="Entrar"
            loading={isLoading}
            size="lg"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <Pressable onPress={() => router.push('/(auth)/register/select-type')}>
            <Text style={styles.footerLink}>Cadastre-se</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[900] },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.screenHorizontal,
    gap: Spacing[6],
  },
  header: { alignItems: 'center', gap: Spacing[3] },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.neutral[400],
  },
  card: {
    backgroundColor: Colors.neutral[800],
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    gap: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.neutral[700],
  },
  forgotPassword: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.brand[400],
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing[2],
    paddingBottom: Spacing[6],
  },
  footerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[400],
  },
  footerLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.brand[400],
  },
});
