import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/theme';
import { Logo } from '@/components/shared/Logo';
import { AppIcon, AppIconName } from '@/components/shared/AppIcon';

const types: { key: string; icon: AppIconName; title: string; description: string; route: string }[] = [
  {
    key: 'consumer',
    icon: 'shopping-cart',
    title: 'Consumidor',
    description: 'Compre materiais de construção e contrate prestadores de serviço.',
    route: '/(auth)/register/consumer',
  },
  {
    key: 'provider',
    icon: 'hammer',
    title: 'Prestador',
    description: 'Ofereça seus serviços de construção e reforma para consumidores.',
    route: '/(auth)/register/provider',
  },
  {
    key: 'company',
    icon: 'store',
    title: 'Empresa',
    description: 'Cadastre sua loja e venda materiais de construção.',
    route: '/(auth)/register/company',
  },
];

export default function SelectTypeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Logo dark />
        <Text style={styles.title}>Como você quer usar o app?</Text>
        <Text style={styles.subtitle}>Escolha seu perfil para começar</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.cards}
        showsVerticalScrollIndicator={false}
      >
        {types.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => router.push(t.route as any)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardIcon}>
              <AppIcon name={t.icon} size={32} color={Colors.brand[500]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.cardDescription}>{t.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Já tenho conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutral[900],
    paddingHorizontal: Spacing.screenHorizontal,
  },
  header: { gap: Spacing[2], marginBottom: Spacing[6] },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.neutral[0],
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.neutral[400],
  },
  cards: { gap: Spacing[3], paddingBottom: Spacing[6] },
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    ...Shadows.md,
  },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.neutral[900],
  },
  cardDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.neutral[500],
    marginTop: 4,
    lineHeight: 20,
  },
  arrow: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.neutral[400],
  },
  backButton: { paddingVertical: Spacing[5], alignItems: 'center' },
  backText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.brand[500],
  },
});
