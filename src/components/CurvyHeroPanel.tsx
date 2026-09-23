import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { SHEET_OVERLAP } from "@trackingPortal/components/scalar/ScalarSheet";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";

/**
 * The tinted top every tab screen opens with. The tint is sized to the hero
 * itself (not the screen), so it always lands on the same end colour where
 * the sheet rises — short heroes (Loans, Invest) separate as clearly as the
 * Wallet one. It also reaches under the status bar.
 */
export default function CurvyHeroPanel({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.panel,
        { paddingTop: insets.top, backgroundColor: colors.heroGradEnd },
      ]}
    >
      <Svg style={styles.tint} pointerEvents="none">
        <Defs>
          <LinearGradient id="scalarHero" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.heroGradTop} />
            <Stop offset="0.5" stopColor={colors.heroGradMid} />
            <Stop offset="1" stopColor={colors.heroGradEnd} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scalarHero)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    // 20 of breathing room plus the sheet's radius, which it overlaps.
    paddingBottom: 20 + SHEET_OVERLAP,
    gap: 18,
  },
  // Starts a pixel high to cover Android's sub-pixel seam at the top edge.
  tint: { position: "absolute", top: -1, left: 0, right: 0, bottom: 0 },
});
