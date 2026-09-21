import React from "react";
import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

export default function CurvyHeroPanel({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.shell}>
      <View
        style={[
          styles.panel,
          { backgroundColor: colors.panel, borderBottomColor: colors.panelEdge },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: "100%" },
  // The gap separates the greeting row from the panel body. Every screen passes
  // <CustomAppBar /> plus one content view, so setting it here spaces all four
  // consistently — the spec allows 14-16px depending on what follows.
  // The panel reads as its own section: a softly rounded bottom edge closed by
  // a hairline, iOS-style. `continuous` gives the squircle curve Apple uses
  // rather than a plain circular arc (ignored on Android, which is fine).
  panel: {
    paddingBottom: 24,
    gap: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderCurve: "continuous",
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
