import CustomTabBar from "@trackingPortal/components/CustomTabBar"; // adjust path if needed
import { Tabs } from "expo-router";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import React from "react";

export default function TabsLayout() {
  const { colors } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // React Navigation's default scene is light grey; on Android it shows
        // for a frame while a tab mounts and fades in — paint it the app's bg.
        sceneStyle: { backgroundColor: colors.background },
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
