import React from "react";
import { StyleSheet, View } from "react-native";

import LightGlow from "@trackingPortal/components/scalar/LightGlow";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

/**
 * The glow every screen sits on (light and dark). Glass surfaces above it
 * pick up its colour.
 */
export default function ScreenGradient() {
  const { isDark } = useAppTheme();
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
        <LightGlow width={size.width} height={size.height} dark={isDark} />
      ) : null}
    </View>
  );
}
