import React, { useId } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";

// Measured from the design at 2px per point.
const SIZE = 40;

/** The round, softly lit close button every sheet uses. */
export default function SheetCloseButton({
  onPress,
  accessibilityLabel,
  style,
}: {
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  // Several sheets can be mounted at once; gradient ids must not collide.
  const gradientId = `sheetClose${useId().replace(/:/g, "")}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? t("common.close")}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        Platform.OS === "ios" && {
          // Soft tinted halo; Android elevation would draw a grey one instead.
          // Design: 0 4px 12px at 18% in light; 0 0 14px at 18% in dark.
          shadowColor: colors.negative,
          shadowOpacity: 0.18,
          shadowRadius: isDark ? 7 : 6,
          shadowOffset: { width: 0, height: isDark ? 0 : 4 },
        },
        style,
        pressed && styles.pressed,
      ]}
    >
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Lit from above: lighter top, deeper bottom. */}
          <LinearGradient id={`${gradientId}fill`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={isDark ? colors.negative : "#FDF1EC"} stopOpacity={isDark ? 0.26 : 1} />
            <Stop offset="1" stopColor={isDark ? colors.negative : "#F8DED4"} stopOpacity={isDark ? 0.12 : 1} />
          </LinearGradient>
          {/* The 1px inset highlight along the top edge. */}
          <LinearGradient id={`${gradientId}rim`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={isDark ? "#FFB496" : "#FFFFFF"} stopOpacity={isDark ? 0.22 : 1} />
            <Stop offset="0.3" stopColor={isDark ? "#FFB496" : "#FFFFFF"} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - 0.5}
          fill={`url(#${gradientId}fill)`}
          stroke={colors.negative}
          strokeOpacity={isDark ? 0.38 : 0.22}
          strokeWidth={1}
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - 1.5}
          fill="none"
          stroke={`url(#${gradientId}rim)`}
          strokeWidth={1}
        />
      </Svg>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M6 6l12 12M18 6L6 18" stroke={colors.negative} strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZE / 2,
  },
  pressed: { opacity: 0.75 },
});
