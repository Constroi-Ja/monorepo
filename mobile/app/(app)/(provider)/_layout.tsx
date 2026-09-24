import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, FontFamily } from '@/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function ProviderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* ── Tabs visíveis ── */}
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Painel" focused={focused} /> }}
      />
      <Tabs.Screen
        name="visits/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗓️" label="Visitas" focused={focused} /> }}
      />
      <Tabs.Screen
        name="stores/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🛍️" label="Compras" focused={focused} /> }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Pedidos" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Perfil" focused={focused} /> }}
      />

      {/* ── Rotas escondidas ── */}
      <Tabs.Screen name="visits/[id]" options={{ href: null }} />
      <Tabs.Screen name="stores/[storeId]" options={{ href: null }} />
      <Tabs.Screen name="cart/index" options={{ href: null }} />
      <Tabs.Screen name="cart/checkout" options={{ href: null }} />
      <Tabs.Screen name="orders/[orderId]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar.bg,
    borderTopColor: Colors.neutral[200],
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  emoji: { fontSize: 24, opacity: 0.5 },
  emojiActive: { opacity: 1 },
  label: { fontFamily: FontFamily.regular, fontSize: 10, color: Colors.tabBar.inactive, textAlign: 'center' },
  labelActive: { color: Colors.tabBar.active, fontFamily: FontFamily.semiBold },
});
