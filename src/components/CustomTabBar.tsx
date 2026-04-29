import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@trackingPortal/themes/colors";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { ComponentProps, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  InteractionManager,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "transactions", label: "Transactions", icon: "home-outline" },
  { name: "loan", label: "Loans", icon: "bank-outline" },
  { name: "investment", label: "Invest", icon: "chart-bar" },
  { name: "settings", label: "Settings", icon: "account-outline" },
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

  const findRoute = (name: string) =>
    state.routes.find((r: any) => r.name === name);

  // GLOW COMPONENT FOR ANDROID/IOS
  const PlusButtonGlow = () => (
    <View style={styles.glowContainer}>
      <Svg height="100" width="100" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient
            id="grad"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="45" fill="url(#grad)" />
      </Svg>
    </View>
  );

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 10 }]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={30} tint="dark" style={styles.container}>
          <View style={styles.side}>
            {renderTabByName("transactions")}
            {renderTabByName("loan")}
          </View>
          <View style={styles.centerSpace} />
          <View style={styles.side}>
            {renderTabByName("investment")}
            {renderTabByName("settings")}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.container, styles.androidContainer]}>
          <View style={styles.side}>
            {renderTabByName("transactions")}
            {renderTabByName("loan")}
          </View>
          <View style={styles.centerSpace} />
          <View style={styles.side}>
            {renderTabByName("investment")}
            {renderTabByName("settings")}
          </View>
        </View>
      )}

      {/* CENTER BUTTON */}
      {state.routes[state.index].name !== "settings" && (
        <View style={styles.centerButton}>
          <PlusButtonGlow />
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.touchableArea}
            onPress={handlePlusPress}
          >
            <View style={styles.centerButtonInner}>
              <MaterialCommunityIcons name="plus" size={32} color="#000" />
            </View>
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

const TabButton = React.memo(function TabButton({
  tab,
  isFocused,
  onPress,
}: {
  tab: any;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(isFocused ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.05 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabWrapper}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          isFocused && styles.activeIconContainer,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={tab.icon}
          size={22}
          color={isFocused ? colors.primary : colors.subText}
        />
      </Animated.View>

      <View style={[styles.activeDot, { opacity: isFocused ? 1 : 0 }]} />

      <Text
        style={[
          styles.label,
          {
            color: isFocused ? colors.primary : colors.subText,
            opacity: isFocused ? 1 : 0.7,
          },
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 70,
    width: "100%",
    borderRadius: 35,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  side: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
  },
  centerSpace: {
    width: 60,
  },
  tabWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
  },
  activeIconContainer: {
    backgroundColor: 'transparent',
  },
  activeDot: {
    display: 'none',
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  centerButton: {
    position: "absolute",
    top: -15,
    alignSelf: "center",
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  touchableArea: {
    borderRadius: 30,
  },
  androidContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
