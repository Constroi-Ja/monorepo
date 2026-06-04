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

export default function CompanyLayout() {
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
      <Tabs.Screen name="orders/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="package" label="Pedidos" focused={focused} /> }} />
      <Tabs.Screen name="inventory/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="clipboard" label="Estoque" focused={focused} /> }} />
      <Tabs.Screen name="revenue/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="money-bag" label="Financeiro" focused={focused} /> }} />
      <Tabs.Screen name="settings/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="settings" label="Perfil" focused={focused} /> }} />
      {/* Telas não-tab */}
      <Tabs.Screen name="bills/index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="deliveries/index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="items/index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="items/[itemId]" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="orders/[orderId]" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, paddingTop: 8 },
  tabLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  tabLabelActive: { color: Colors.tabBar.active, fontFamily: FontFamily.semiBold },
});
