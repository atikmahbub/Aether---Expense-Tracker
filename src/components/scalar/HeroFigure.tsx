import React from "react";
import { StyleSheet, Text, View } from "react-native";

import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

/** Label, wide-face headline figure and an optional footnote on the tinted top. */
export default function HeroFigure({
  label,
  amount,
  footer,
  size = 38,
}: {
  label: string;
  amount: string;
  footer?: string;
  size?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: colors.heroText }]}>{label}</Text>
      {/* No adjustsFontSizeToFit: it collapses multi-font-run amounts (the ৳
          is Noto Sans Bengali) on iOS. */}
      <ScalarAmountText
        numberOfLines={1}
        style={[
          styles.amount,
          {
            color: colors.heroInk,
            fontSize: size,
            lineHeight: Math.round(size * 1.25),
            letterSpacing: -size * 0.02,
          },
        ]}
      >
        {amount}
      </ScalarAmountText>
      {footer ? (
        <Text style={[styles.footer, { color: colors.heroTextSecondary }]}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 2 },
  label: { fontFamily: designTokens.font.medium, fontSize: 14, lineHeight: 19 },
  amount: {
    fontFamily: designTokens.font.display,
    fontVariant: ["tabular-nums"],
  },
  footer: { fontFamily: designTokens.font.medium, fontSize: 14, lineHeight: 19 },
});
