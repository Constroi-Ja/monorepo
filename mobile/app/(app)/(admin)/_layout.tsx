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

export default function AdminLayout() {
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
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Overview" focused={focused} /> }}
      />
      <Tabs.Screen
        name="users/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Usuários" focused={focused} /> }}
      />
      <Tabs.Screen
        name="providers/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔨" label="Prestadores" focused={focused} /> }}
      />
      <Tabs.Screen
        name="stores/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" label="Lojas" focused={focused} /> }}
      />

      {/* ── Rotas escondidas ── */}
      <Tabs.Screen name="reviews/index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar.bgDark,
    borderTopColor: Colors.neutral[800],
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  emoji: { fontSize: 24, opacity: 0.4 },
  emojiActive: { opacity: 1 },
  label: { fontFamily: FontFamily.regular, fontSize: 10, color: Colors.neutral[600], textAlign: 'center' },
  labelActive: { color: Colors.tabBar.active, fontFamily: FontFamily.semiBold },
});
