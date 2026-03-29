import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@trackingPortal/themes/colors";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { ComponentProps, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  InteractionManager,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "expense", label: "EXPENSES", icon: "cash" },
  { name: "loan", label: "LOANS", icon: "bank-outline" },
  { name: "investment", label: "INVEST", icon: "chart-line-variant" },
  { name: "settings", label: "SETTINGS", icon: "cog-outline" },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (routeName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate(routeName);
      });
    },
    [navigation],
  );

  const handlePlusPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    eventEmitter.emit(EVENTS.OPEN_CREATION_MODAL);
  }, []);

  // Helper to find a route by its name
  const findRoute = (name: string) =>
    state.routes.find((r: any) => r.name === name);

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 10 }]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={30} tint="dark" style={styles.container}>
          <View style={styles.side}>
            {renderTabByName("expense")}
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
            {renderTabByName("expense")}
            {renderTabByName("loan")}
          </View>
          <View style={styles.centerSpace} />
          <View style={styles.side}>
            {renderTabByName("investment")}
            {renderTabByName("settings")}
          </View>
        </View>
      )}

      {/* CENTER BUTTON - Hidden on settings screen */}
      {state.routes[state.index].name !== "settings" && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.centerButton}
          onPress={handlePlusPress}
        >
          <View style={styles.centerButtonInner}>
            <MaterialCommunityIcons name="plus" size={32} color="#000" />
          </View>
        </TouchableOpacity>
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

    // Use a Ref to store the animated scale value for each tab
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

const TabButton = React.memo(
  ({
    tab,
    isFocused,
    onPress,
  }: {
    tab: any;
    isFocused: boolean;
    onPress: () => void;
  }) => {
    const scale = useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;

    useEffect(() => {
      Animated.spring(scale, {
        toValue: isFocused ? 1.1 : 1,
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

        <Text
          style={[
            styles.label,
            {
              color: isFocused ? colors.primary : colors.subText,
            },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background, // This ensures content does not show under the floating bar area
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(161, 250, 255, 0.05)", // Very subtle top border
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
    borderColor: "rgba(161, 250, 255, 0.15)", // Premium glass border
    overflow: "hidden", // Important for BlurView
    backgroundColor: "rgba(15, 20, 24, 0.7)", // Semi-transparent
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
    backgroundColor: "rgba(161, 250, 255, 0.1)",
  },

  label: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.5,
  },

  centerButton: {
    position: "absolute",
    top: -15, // Slightly less elevation to keep it within safe bounds
    alignSelf: "center",
    zIndex: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },

  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.background, // Match background to create gap effect
    elevation: 12,
  },

  androidContainer: {
    backgroundColor: "rgba(15, 20, 24, 0.95)", // More opaque for Android visibility
    borderWidth: 1,
    borderColor: "rgba(161, 250, 255, 0.15)",
  },
});
