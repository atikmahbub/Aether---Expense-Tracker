import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

export default function CurvyHeroPanel({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.shell}>
      <View style={[styles.panel, { backgroundColor: colors.panel }]}>{children}</View>
      <Svg width="100%" height={29} viewBox="0 0 390 29" preserveAspectRatio="none">
        <Path d="M0 0 H390 V28 C300 28 290 2 195 2 C100 2 90 28 0 28 Z" fill={colors.panel} />
        <Path d="M390 28 C300 28 290 2 195 2 C100 2 90 28 0 28" fill="none" stroke={colors.panelEdge} strokeWidth={1} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ shell: { width: "100%" }, panel: { paddingBottom: 10 } });
