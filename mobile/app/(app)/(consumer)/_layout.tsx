import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, FontFamily } from '@/theme';
import { useCartStore } from '@/store/cartStore';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

function CartTab({ focused }: { focused: boolean }) {
  const count = useCartStore((s) => s.count);
  return (
    <View style={styles.tabItem}>
      <View>
        <Text style={[styles.emoji, focused && styles.emojiActive]}>🛒</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>Carrinho</Text>
    </View>
  );
}

export default function ConsumerLayout() {
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
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Início" focused={focused} /> }}
      />
      <Tabs.Screen
        name="stores/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" label="Buscar" focused={focused} /> }}
      />
      <Tabs.Screen
        name="cart/index"
        options={{ tabBarIcon: ({ focused }) => <CartTab focused={focused} /> }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Pedidos" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Perfil" focused={focused} /> }}
      />

      {/* ── Rotas escondidas da tab bar ── */}
      <Tabs.Screen name="stores/[storeId]" options={{ href: null }} />
      <Tabs.Screen name="cart/checkout" options={{ href: null }} />
      <Tabs.Screen name="orders/[orderId]" options={{ href: null }} />
      <Tabs.Screen name="providers/index" options={{ href: null }} />
      <Tabs.Screen name="providers/[providerId]" options={{ href: null }} />
      <Tabs.Screen name="visits/index" options={{ href: null }} />
      <Tabs.Screen name="visits/[id]" options={{ href: null }} />
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
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  emoji: { fontSize: 24, opacity: 0.5 },
  emojiActive: { opacity: 1 },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.tabBar.inactive,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.tabBar.active,
    fontFamily: FontFamily.semiBold,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.tabBar.badge,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: '#fff' },
});
