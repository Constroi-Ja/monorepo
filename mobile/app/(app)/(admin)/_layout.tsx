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

export default function AdminLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar.bgDark,
          borderTopColor: Colors.neutral[800],
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="bar-chart" label="Overview" focused={focused} /> }} />
      <Tabs.Screen name="users/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="users-group" label="Usuários" focused={focused} /> }} />
      <Tabs.Screen name="providers/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="hammer" label="Prestadores" focused={focused} /> }} />
      <Tabs.Screen name="stores/index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="store" label="Lojas" focused={focused} /> }} />
      {/* Telas não-tab */}
      <Tabs.Screen name="reviews/index" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, paddingTop: 8 },
  tabLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[500] },
  tabLabelActive: { color: Colors.tabBar.active, fontFamily: FontFamily.semiBold },
});
