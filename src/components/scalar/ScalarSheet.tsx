import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

// Clears the floating dock (64 tall + its fade and safe-area inset).
export const DOCK_CLEARANCE = 112;
// The sheet rises this far over the hero so its rounded corners always sit on
// the tint (no reliance on overflow, which Android clips).
export const SHEET_OVERLAP = 36;

/** The sheet that rises under the tinted top and holds list content. */
export default function ScalarSheet({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: colors.sheet, borderColor: colors.sheetBorder },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flexGrow: 1,
    marginTop: -SHEET_OVERLAP,
    borderTopLeftRadius: designTokens.radius.sheet,
    borderTopRightRadius: designTokens.radius.sheet,
    borderCurve: "continuous",
    borderTopWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: DOCK_CLEARANCE,
    gap: 6,
  },
});
