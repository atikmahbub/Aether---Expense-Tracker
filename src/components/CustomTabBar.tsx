import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@trackingPortal/themes/colors";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "transactions", label: "Wallet", icon: "wallet-outline" },
  { name: "loan", label: "Loans", icon: "bank-outline" },
  { name: "investment", label: "Invest", icon: "chart-bar" },
  { name: "settings", label: "Settings", icon: "cog-outline" },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  const handlePress = useCallback(
    (routeName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(routeName);
    },
    [navigation],
  );

  const handlePlusPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    eventEmitter.emit(EVENTS.OPEN_CREATION_MODAL);
  }, []);

  const activeRouteName = state.routes[state.index].name;

  const findRoute = (name: string) =>
    state.routes.find((r: any) => r.name === name);

  const PlusButtonGlow = () => (
    <View style={styles.glowContainer}>
      <Svg height="100" width="100" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
            <Stop offset="70%" stopColor={colors.primary} stopOpacity="0.1" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="45" fill="url(#grad)" />
      </Svg>
    </View>
  );

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 4 }]}>
      <BlurView intensity={Platform.OS === 'ios' ? 45 : 100} tint="dark" style={styles.container}>
        <View style={styles.tabContainer}>
          {renderTabByName("transactions")}
          {renderTabByName("loan")}
          
          <View style={styles.centerSpacer} />
          
          {renderTabByName("investment")}
          {renderTabByName("settings")}
        </View>
      </BlurView>

      {/* CENTER BUTTON */}
      {activeRouteName !== "settings" && (
        <View style={styles.centerButton}>
          <PlusButtonGlow />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePlusPress}
            style={styles.plusButtonInner}
          >
            <MaterialCommunityIcons name="plus" size={32} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  function renderTabByName(name: string) {
    const route = findRoute(name);
    if (!route) return null;

    const routeIndex = state.routes.findIndex((r: any) => r.name === name);
    const isFocused = state.index === routeIndex;
    const tab = TABS.find((t) => t.name === name);

    if (!tab) return null;

    return (
      <TabButton
        key={tab.name}
        tab={tab}
        isFocused={isFocused}
        onPress={() => handlePress(route.name)}
      />
    );
  }
}

const TabButton = ({ tab, isFocused, onPress }: any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={tab.icon}
        size={24}
        color={isFocused ? colors.primary : colors.muted}
      />
      <Text style={[styles.label, { color: isFocused ? colors.primary : colors.muted }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.92,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  container: {
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(20, 24, 34, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  centerSpacer: {
    width: 60,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'column',
    height: '100%',
    minWidth: 64,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: 'Manrope',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  centerButton: {
    position: "absolute",
    top: -26,
    alignSelf: "center",
    zIndex: 110,
  },
  plusButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  glowContainer: {
    position: 'absolute',
    top: -17,
    left: -17,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
});
