import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

/**
 * The vertical tint every screen sits on: cream (or deep navy in dark) at the
 * top, fading into the page colour by ~60% of the height.
 */
export default function ScreenGradient() {
  const { colors } = useAppTheme();
  // Size the SVG in real pixels: percentage sizing leaves it at its intrinsic
  // size on some devices, so the tint stops short of the screen edges.
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id="scalarScreen" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.heroGradTop} />
              <Stop offset="0.34" stopColor={colors.heroGradMid} />
              <Stop offset="0.62" stopColor={colors.heroGradBottom} />
              <Stop offset="1" stopColor={colors.heroGradBottom} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill="url(#scalarScreen)" />
        </Svg>
      ) : null}
    </View>
  );
}
