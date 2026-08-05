import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

export default function CurvyHeroPanel({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.shell}>
      <View style={[styles.panel, { backgroundColor: colors.panel }]}>{children}</View>
      <Svg width="100%" height={48} viewBox="0 0 390 48" preserveAspectRatio="none">
        <Path d="M0 0 H390 V46 C300 46 290 2 195 2 C100 2 90 46 0 46 Z" fill={colors.panel} />
        <Path d="M390 46 C300 46 290 2 195 2 C100 2 90 46 0 46" fill="none" stroke={colors.panelEdge} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: "100%" },
  // The gap separates the greeting row from the panel body. Every screen passes
  // <CustomAppBar /> plus one content view, so setting it here spaces all four
  // consistently — the spec allows 14-16px depending on what follows.
  panel: { paddingBottom: 10, gap: 14 },
});
