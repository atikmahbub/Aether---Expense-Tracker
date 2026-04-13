import CustomTabBar from "@trackingPortal/components/CustomTabBar"; // adjust path if needed
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="transactions" options={{ lazy: false }} />
      <Tabs.Screen name="loan" />
      <Tabs.Screen name="investment" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
