import { BlurView } from "expo-blur";
import React, { useState } from "react";
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
 * Android skips the blur; the tint over the solid dock backing reads the same.
 */
export default function GlassSurface({ children, style, contentStyle, radius, intensity = 40 }: Props) {
  const { colors, isDark } = useAppTheme();
  const clip = { borderRadius: radius, overflow: "hidden" as const };
  // The SVG sheen doesn't redraw when the surface resizes (the dock widens
  // when the add button hides), leaving a seam at the old edge — remount it at
  // the measured size. The blur resizes natively; remounting it would flash.
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    // Shadow lives on this un-clipped wrapper; the clip below would cut it.
    <View
      style={[{ borderRadius: radius }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      }}
    >
      <View style={[StyleSheet.absoluteFill, clip]} pointerEvents="none">
        {/* The dock sits on a solid backing, so the blur shows almost
            nothing there; Android skips it to spare a per-frame blur pass. */}
        {Platform.OS === "ios" && (
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={intensity}
            tint={isDark ? "dark" : "light"}
          />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
        <Svg
          key={`${size.width}x${size.height}`}
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
        >
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
