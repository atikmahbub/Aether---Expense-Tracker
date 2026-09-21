import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

/**
 * The hero slab every tab screen opens with. It reads as its own surface —
 * a deep panel that ends in a wide, continuous curve and casts a soft shadow
 * onto the content scrolling beneath it, rather than being fenced off by a
 * drawn line. The shadow lives on an outer view because the inner one clips
 * its children to the curve.
 */
export default function CurvyHeroPanel({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.shell, { shadowColor: colors.background }]}>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.panel,
            borderBottomColor: colors.panelTileBorder,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    // Ambient depth only — no offset blur halo, just enough to lift the slab
    // off whatever scrolls under it.
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  // The gap separates the greeting row from the panel body. Every screen passes
  // <CustomAppBar /> plus one content view, so setting it here spaces all four
  // consistently — the spec allows 14-16px depending on what follows.
  panel: {
    paddingBottom: 26,
    gap: 14,
    // A wide squircle: `continuous` is the Apple curve rather than a circular
    // arc. Android ignores it and falls back to a plain radius, which is fine.
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderCurve: "continuous",
    // A whisper of a rim light along the curve — felt, not read as a border.
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
