import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/theme';
import { useCartStore } from '@/store/cartStore';
import { useTheme } from '@/hooks/useTheme';
import { AppIcon, AppIconName } from '@/components/shared/AppIcon';

function TabIcon({ iconName, label, focused }: { iconName: AppIconName; label: string; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tabItem}>
      <AppIcon name={iconName} size={22} color={focused ? Colors.tabBar.active : colors.tabInactive} />
      <Text style={[styles.tabLabel, { color: colors.tabInactive }, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function CartTabIcon({ focused }: { focused: boolean }) {
  const count = useCartStore((s) => s.count);
  const { colors } = useTheme();
  return (
    <View style={styles.tabItem}>
      <View>
        <AppIcon name="shopping-cart" size={22} color={focused ? Colors.tabBar.active : colors.tabInactive} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, { color: colors.tabInactive }, focused && styles.tabLabelActive]}>Carrinho</Text>
    </View>
  );
}

export default function ConsumerLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBorder,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="home" label="Início" focused={focused} /> }} />
      <Tabs.Screen name="stores/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="search" label="Buscar" focused={focused} /> }} />
      <Tabs.Screen name="cart/index" options={{ tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} /> }} />
      <Tabs.Screen name="orders/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="package" label="Pedidos" focused={focused} /> }} />
      <Tabs.Screen name="settings/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="user-profile" label="Perfil" focused={focused} /> }} />
      {/* Telas não-tab — ocultas da barra mas navegáveis */}
      <Tabs.Screen name="cart/checkout" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="orders/[orderId]" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="providers/index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="stores/[storeId]" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="visits/index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="visits/[id]" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, paddingTop: 8 },
  tabLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  tabLabelActive: { color: Colors.tabBar.active, fontFamily: FontFamily.semiBold },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: Colors.tabBar.badge,
    borderRadius: 999, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: '#fff' },
});
