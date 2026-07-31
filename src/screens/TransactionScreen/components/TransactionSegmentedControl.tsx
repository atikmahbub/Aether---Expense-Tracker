import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

interface SegmentedControlProps {
  options: string[];
  selectedOption: string;
  onOptionPress: (option: string) => void;
  containerStyle?: object;
}

const TransactionSegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedOption,
  onOptionPress,
  containerStyle,
}) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);
  const gap = 4;
  const padding = 4;
  const segmentWidth = width
    ? (width - padding * 2 - gap * (options.length - 1)) / options.length
    : 0;
  const selectedIndex = Math.max(options.indexOf(selectedOption), 0);

  useEffect(() => {
    translateX.value = withTiming(selectedIndex * (segmentWidth + gap), {
      duration: designTokens.motion.quick,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedIndex, segmentWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.track, containerStyle]} onLayout={onLayout}>
      {segmentWidth > 0 && (
        <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
      )}
      {options.map((option) => {
        const active = option === selectedOption;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={option}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync();
              onOptionPress(option);
            }}
            style={({ pressed }) => [
              styles.segment,
              pressed && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.label, active ? styles.activeLabel : styles.inactiveLabel]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

function makeStyles(
  colors: ReturnType<typeof useAppTheme>["colors"],
  isDark: boolean,
) {
  return StyleSheet.create({
    track: {
      position: "relative",
      flexDirection: "row",
      gap: 4,
      padding: 4,
      minHeight: 52,
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.surfaceSunken,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    activeIndicator: {
      position: "absolute",
      left: 4,
      top: 4,
      height: 44,
      borderRadius: designTokens.radius.full,
      backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      shadowColor: colors.textPrimary,
      shadowOpacity: isDark ? 0 : 0.12,
      shadowRadius: isDark ? 0 : 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: isDark ? 0 : 2,
    },
    segment: {
      zIndex: 1,
      flex: 1,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
    },
    segmentPressed: {
      backgroundColor: colors.brandWash,
    },
    label: {
      fontSize: 15,
      lineHeight: 20,
    },
    activeLabel: {
      color: colors.brandText,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
    },
    inactiveLabel: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.semibold,
      fontWeight: "600",
    },
  });
}

export default TransactionSegmentedControl;
