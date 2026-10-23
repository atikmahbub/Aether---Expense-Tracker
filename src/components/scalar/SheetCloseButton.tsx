import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useId } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

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
          shadowColor: colors.negative,
          shadowOpacity: isDark ? 0.18 : 0.14,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
        style,
        pressed && styles.pressed,
      ]}
    >
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Lit from above: lighter top, deeper bottom. */}
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={isDark ? colors.negative : "#FFFFFF"} stopOpacity={isDark ? 0.1 : 0.4} />
            <Stop offset="0.5" stopColor="#000000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000000" stopOpacity={isDark ? 0.24 : 0.025} />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 0.5} fill={colors.negativeTile} />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - 0.5}
          fill={`url(#${gradientId})`}
          stroke={colors.negative}
          strokeOpacity={isDark ? 0.42 : 0.25}
          strokeWidth={1}
        />
      </Svg>
      <MaterialCommunityIcons name="close" size={18} color={colors.negative} />
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
