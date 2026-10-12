import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

type Props = {
  children?: React.ReactNode;
  /** Outer style: size, radius, margins, shadow. */
  style?: StyleProp<ViewStyle>;
  /** Layout of the content inside the glass. */
  contentStyle?: StyleProp<ViewStyle>;
  radius: number;
  intensity?: number;
};

/**
 * Frosted glass for surfaces that float over moving content (the dock):
 * a real blur, a theme tint on top, a bright rim and a soft top sheen.
 * Android blurs via expo-blur's Dimezis method.
 */
export default function GlassSurface({ children, style, contentStyle, radius, intensity = 40 }: Props) {
  const { colors, isDark } = useAppTheme();
  const clip = { borderRadius: radius, overflow: "hidden" as const };
  return (
    // Shadow lives on this un-clipped wrapper; the clip below would cut it.
    <View style={[{ borderRadius: radius }, style]}>
      <View style={[StyleSheet.absoluteFill, clip]} pointerEvents="none">
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={intensity}
          tint={isDark ? "dark" : "light"}
          experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="glassSheen" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={isDark ? 0.08 : 0.5} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#glassSheen)" />
        </Svg>
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius, borderWidth: 1, borderColor: colors.glassRim },
          ]}
        />
      </View>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
