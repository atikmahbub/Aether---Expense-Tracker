import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

/**
 * The vertical tint every screen sits on: sage (or deep green in dark) at the
 * top, fading into the page colour by ~60% of the height.
 */
export default function ScreenGradient() {
  const { colors } = useAppTheme();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="scalarScreen" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.heroGradTop} />
          <Stop offset="0.34" stopColor={colors.heroGradMid} />
          <Stop offset="0.62" stopColor={colors.heroGradBottom} />
          <Stop offset="1" stopColor={colors.heroGradBottom} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#scalarScreen)" />
    </Svg>
  );
}
