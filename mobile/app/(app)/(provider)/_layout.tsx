import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/theme';
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

export default function ProviderLayout() {
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
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="bar-chart" label="Painel" focused={focused} /> }} />
      <Tabs.Screen name="visits/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="calendar" label="Visitas" focused={focused} /> }} />
      <Tabs.Screen name="stores/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="bag" label="Compras" focused={focused} /> }} />
      <Tabs.Screen name="orders/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="package" label="Pedidos" focused={focused} /> }} />
      <Tabs.Screen name="settings/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="user-profile" label="Perfil" focused={focused} /> }} />
      {/* Telas não-tab */}
      <Tabs.Screen name="cart/index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="cart/checkout" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="orders/[orderId]" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="stores/[storeId]" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, paddingTop: 8 },
  tabLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  tabLabelActive: { color: Colors.tabBar.active, fontFamily: FontFamily.semiBold },
});
