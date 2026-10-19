import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, FadeIn, LinearTransition, ZoomIn, ZoomOut } from "react-native-reanimated";
import DockIcon, { DockIconName } from "@trackingPortal/components/scalar/DockIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import GlassSurface from "@trackingPortal/components/scalar/GlassSurface";

const FADE = 32;
// The selected tab widens into an icon + label pill; neighbours glide aside.
// Spec: 260ms ease on width, fill and padding; the label fades in 200ms.
const TAB_LAYOUT = LinearTransition.duration(260).easing(Easing.ease);

const TABS: { name: string; label: string; icon: DockIconName }[] = [
  { name: "transactions", label: "Wallet", icon: "wallet" },
  { name: "loan", label: "Loans", icon: "loans" },
  { name: "investment", label: "Invest", icon: "invest" },
  { name: "settings", label: "Settings", icon: "settings" },
];

export default function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
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
      <Animated.View key={name} layout={TAB_LAYOUT}>
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: focused }}
          onPress={() => handleTabPress(route.name)}
          style={({ pressed }) => [
            styles.tab,
            focused && styles.tabActive,
            pressed && styles.pressed,
          ]}
        >
          <DockIcon
            name={tab.icon}
            color={focused ? colors.dockActive : colors.dockIcon}
          />
          {focused && (
            <Animated.Text
              entering={FadeIn.duration(200)}
              numberOfLines={1}
              style={styles.tabLabel}
            >
              {tab.label}
            </Animated.Text>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom - 16, 8) }]}
    >
      {/* Content fades out above the dock, and a backing hides it beside
          and below — nothing scrolls visibly around the frosted dock. */}
      <View
        pointerEvents="none"
        style={[styles.backing, { backgroundColor: colors.dockBacking }]}
      />
      <Svg style={styles.fade} pointerEvents="none">
        <Defs>
          <LinearGradient id="dockFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.dockBacking} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.dockBacking} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dockFade)" />
      </Svg>
      <View style={styles.dockRowOuter}>
        <Animated.View layout={TAB_LAYOUT} style={styles.dockWrap}>
          <GlassSurface
            style={styles.dock}
            contentStyle={styles.dockRow}
            radius={designTokens.radius.full}
          >
            {renderTab("transactions")}
            {renderTab("loan")}
            {renderTab("investment")}
            {renderTab("settings")}
          </GlassSurface>
        </Animated.View>
        {!isSettings && (
          <Animated.View
            entering={ZoomIn.duration(220)}
            exiting={ZoomOut.duration(180)}
            style={styles.addWrap}
          >
            <Pressable
              accessibilityLabel="Add entry"
              accessibilityRole="button"
              onPress={handlePlusPress}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              <DockIcon name="plus" color={colors.dockPlusInk} />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useAppTheme>["colors"],
  isDark: boolean,
) {
  return StyleSheet.create({
    // Floats over the sheet; screens pad their content by DOCK_CLEARANCE.
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: FADE,
    },
    fade: { position: "absolute", top: 0, left: 0, right: 0, height: FADE },
    backing: { position: "absolute", top: FADE, left: 0, right: 0, bottom: 0 },
    dockRowOuter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 16,
    },
    dockWrap: { flex: 1 },
    dock: {
      alignSelf: "stretch",
      height: 64,
      // Soft navy lift in light, a deeper drop in dark.
      shadowColor: isDark ? "#000000" : "#2D4263",
      shadowOpacity: isDark ? 0.5 : 0.16,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 12 },
    },
    dockRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    tab: {
      minWidth: 48,
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: designTokens.radius.full,
    },
    tabActive: {
      paddingLeft: 14,
      paddingRight: 16,
      backgroundColor: colors.dockActiveBg,
    },
    tabLabel: {
      color: colors.dockActive,
      fontFamily: designTokens.font.semibold,
      fontSize: 14,
      letterSpacing: 0.14,
    },
    pressed: {
      backgroundColor: colors.dockPressed,
      transform: [{ scale: 0.94 }],
    },
    addWrap: {
      // Same lift as the dock so the two read as one floating group.
      shadowColor: isDark ? "#000000" : "#2D4263",
      shadowOpacity: isDark ? 0.5 : 0.16,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 12 },
    },
    addButton: {
      width: 64,
      height: 64,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.dockPlus,
    },
    addButtonPressed: {
      transform: [{ scale: 0.9 }],
    },
  });
}
