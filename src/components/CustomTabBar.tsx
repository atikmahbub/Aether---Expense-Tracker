import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import * as Haptics from "expo-haptics";
import React, { ComponentProps, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "transactions", label: "Wallet", icon: "wallet" },
  { name: "loan", label: "Loans", icon: "bank" },
  { name: "investment", label: "Invest", icon: "chart-box" },
  { name: "settings", label: "Settings", icon: "cog" },
];

export default function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isSettings = state.routes[state.index]?.name === "settings";

  const handleTabPress = useCallback(
    (routeName: string) => {
      Haptics.selectionAsync();
      navigation.navigate(routeName);
    },
    [navigation],
  );

  const handlePlusPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    eventEmitter.emit(EVENTS.OPEN_CREATION_MODAL);
  }, []);

  const renderTab = (name: string) => {
    const routeIndex = state.routes.findIndex((route) => route.name === name);
    const route = state.routes[routeIndex];
    const tab = TABS.find((candidate) => candidate.name === name);
    if (!route || !tab) return null;
    const focused = state.index === routeIndex;

    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        key={name}
        onPress={() => handleTabPress(route.name)}
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      >
        <View style={[styles.rule, focused && styles.activeRule]} />
        <MaterialCommunityIcons
          name={tab.icon}
          size={19}
          color={focused ? colors.brandText : colors.textTertiary}
        />
        <Text style={[styles.label, focused && styles.activeLabel]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 18) },
      ]}
    >
      <View style={styles.row}>
        {renderTab("transactions")}
        {renderTab("loan")}
        <Pressable
          accessibilityLabel={isSettings ? "Settings" : "Add entry"}
          accessibilityRole="button"
          onPress={handlePlusPress}
          disabled={isSettings}
          style={({ pressed }) => [
            styles.addButton,
            isSettings && styles.addButtonDisabled,
            pressed && !isSettings && styles.addButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name={isSettings ? "book-open-page-variant-outline" : "plus"}
            size={isSettings ? 23 : 28}
            color={isSettings ? colors.textTertiary : colors.onBrand}
          />
        </Pressable>
        {renderTab("investment")}
        {renderTab("settings")}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 4,
    },
    row: {
      height: 61,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    tab: {
      flex: 1,
      height: 55,
      minWidth: 52,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      position: "relative",
    },
    rule: {
      position: "absolute",
      top: 0,
      width: 34,
      height: 3,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      backgroundColor: "transparent",
    },
    activeRule: { backgroundColor: colors.brand },
    pressed: {
      backgroundColor: colors.surfaceSunken,
    },
    label: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.semibold,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "600",
    },
    activeLabel: {
      color: colors.brandText,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
    },
    addButton: {
      width: 56,
      height: 56,
      marginTop: 6,
      marginHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.brand,
    },
    addButtonPressed: {
      backgroundColor: colors.brandText,
    },
    addButtonDisabled: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSunken,
    },
  });
}
