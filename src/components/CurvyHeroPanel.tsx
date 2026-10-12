import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SHEET_OVERLAP } from "@trackingPortal/components/scalar/ScalarSheet";

/**
 * The top every tab screen opens with. It is transparent: the screen's fixed
 * glow (TabScreenContainer) shows through it and on under the glass sheet.
 */
export default function CurvyHeroPanel({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.panel, { paddingTop: insets.top }]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    // 20 of breathing room plus the sheet's radius, which it overlaps.
    paddingBottom: 20 + SHEET_OVERLAP,
    gap: 18,
  },
});
