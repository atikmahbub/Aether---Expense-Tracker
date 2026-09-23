import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

export type HeroStat = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  badge?: string;
};

/** Deep green gradient card with two figures split by a hairline. */
export default function HeroStatCard({
  stats,
  size = 20,
}: {
  stats: [HeroStat, HeroStat];
  size?: number;
}) {
  const { colors } = useAppTheme();
  const [w, setW] = React.useState(0);
  const [h, setH] = React.useState(0);
  const toneColor = (tone: HeroStat["tone"]) =>
    tone === "positive"
      ? colors.statPositive
      : tone === "negative"
        ? colors.statNegative
        : "#FFFFFF";

  return (
    <View
      style={[styles.card, { borderColor: colors.statBorder }]}
      onLayout={(e) => {
        setW(e.nativeEvent.layout.width);
        setH(e.nativeEvent.layout.height);
      }}
    >
      {w > 0 && (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* 160deg CSS gradient ≈ top-left to bottom-right, mostly vertical */}
            <LinearGradient id="heroStat" x1="0.33" y1="0" x2="0.67" y2="1">
              <Stop offset="0" stopColor={colors.statGradFrom} />
              <Stop offset="0.55" stopColor={colors.statGradMid} />
              <Stop offset="1" stopColor={colors.statGradTo} />
            </LinearGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#heroStat)" />
        </Svg>
      )}
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          {i > 0 && (
            <View
              style={[styles.divider, { backgroundColor: colors.statDivider }]}
            />
          )}
          <View style={styles.cell}>
            <Text style={[styles.label, { color: colors.statLabel }]}>
              {stat.label}
            </Text>
            <View style={styles.valueRow}>
              <ScalarAmountText
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.value,
                  { fontSize: size, lineHeight: size * 1.3 },
                  { color: toneColor(stat.tone) },
                ]}
              >
                {stat.value}
              </ScalarAmountText>
              {stat.badge ? (
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: colors.lime, color: colors.onLime },
                  ]}
                >
                  {stat.badge}
                </Text>
              ) : null}
            </View>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: designTokens.radius.statCard,
    borderCurve: "continuous",
    borderWidth: 1,
    overflow: "hidden",
  },
  cell: { flex: 1, minWidth: 0, gap: 4 },
  divider: { width: 1 },
  label: { fontFamily: designTokens.font.regular, fontSize: 13, lineHeight: 17 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: {
    flexShrink: 1,
    fontFamily: designTokens.font.display,
    fontVariant: ["tabular-nums"],
  },
  badge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 11,
    fontFamily: designTokens.font.bold,
  },
});
