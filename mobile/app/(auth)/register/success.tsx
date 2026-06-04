import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';
import { Button } from '@/components/shared/Button';
import { InfoBox } from '@/components/shared/InfoBox';
import { AppIcon } from '@/components/shared/AppIcon';

export default function RegisterSuccessScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
      <AppIcon name="celebration" size={80} color={Colors.brand[500]} />
      <Text style={styles.title}>Conta criada com sucesso!</Text>
      <Text style={styles.subtitle}>
        Enviamos um e-mail de verificação para você. Confirme seu e-mail para ativar a conta.
      </Text>
      <InfoBox
        type="info"
        message="Verifique sua caixa de entrada e clique no link de confirmação que enviamos."
      />
      <Button
        onPress={() => router.replace('/(auth)/login')}
        label="Ir para o login"
        size="lg"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    paddingHorizontal: Spacing.screenHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[5],
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.neutral[900],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
});
