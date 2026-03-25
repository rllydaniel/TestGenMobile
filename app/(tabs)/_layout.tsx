import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="generate" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
      {/* Hidden from tab bar — accessible as routes but no tab item */}
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="study" options={{ href: null }} />
    </Tabs>
  );
}
