import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

interface SegmentedControlProps {
  options: string[];
  selectedOption: string;
  onOptionPress: (option: string) => void;
  containerStyle?: object;
  panel?: boolean;
}

const TransactionSegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedOption,
  onOptionPress,
  containerStyle,
  panel = false,
}) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark, panel), [colors, isDark, panel]);
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);
  const gap = 4;
  const padding = 4;
  const segmentWidth = width
    ? (width - padding * 2 - gap * (options.length - 1)) / options.length
    : 0;
  const selectedIndex = Math.max(options.indexOf(selectedOption), 0);

  useEffect(() => {
    translateX.value = withSpring(selectedIndex * (segmentWidth + gap), {
      damping: 20,
      stiffness: 220,
      mass: 0.7,
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
  panel: boolean,
) {
  return StyleSheet.create({
    track: {
      position: "relative",
      flexDirection: "row",
      gap: 4,
      padding: 4,
      minHeight: 50,
      borderRadius: designTokens.radius.full,
      backgroundColor: panel ? "rgba(0,0,0,0.20)" : colors.surfaceSunken,
      borderWidth: panel || isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: panel ? colors.panelTileBorder : colors.border,
    },
    activeIndicator: {
      position: "absolute",
      left: 4,
      top: 4,
      height: 42,
      borderRadius: designTokens.radius.full,
      backgroundColor: panel ? colors.brandText : isDark ? colors.surfaceRaised : colors.surface,
      borderWidth: panel || isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: panel ? colors.panelTileBorder : colors.border,
      shadowColor: colors.textPrimary,
      shadowOpacity: isDark ? 0.12 : 0.09,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    segment: {
      zIndex: 1,
      flex: 1,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
    },
    segmentPressed: {
      backgroundColor: colors.brandWash,
      transform: [{ scale: 0.985 }],
    },
    label: {
      fontSize: 15,
      lineHeight: 20,
    },
    activeLabel: {
      color: panel ? colors.onBrand : colors.brandText,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
    },
    inactiveLabel: {
      color: panel ? colors.panelTextSecondary : colors.textSecondary,
      fontFamily: designTokens.font.semibold,
      fontWeight: "600",
    },
  });
}

export default TransactionSegmentedControl;
