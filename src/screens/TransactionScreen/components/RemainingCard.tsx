import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

export type RemainingStat = {
  label: string;
  value: string;
  negative?: boolean;
  /** Shows the info icon and makes the column open the explainer. */
  onInfo?: () => void;
};

/** Splits "rgba(r,g,b,a)" for an SVG stop, which ignores alpha in the colour. */
const stop = (rgba: string) => {
  const [r, g, b, a = "1"] = rgba.replace(/rgba?\(|\)/g, "").split(",").map((v) => v.trim());
  return { stopColor: `rgb(${r},${g},${b})`, stopOpacity: Number(a) };
};

/** Dark balance card: Remaining, the available pill, and up to three stats. */
export default function RemainingCard({
  label,
  value,
  negative,
  available,
  stats,
}: {
  label: string;
  value: string;
  negative?: boolean;
  available: string;
  stats: RemainingStat[];
}) {
  const { colors } = useAppTheme();
  const [w, setW] = React.useState(0);
  const [h, setH] = React.useState(0);

  return (
    <View
      style={[styles.card, { borderColor: colors.remainingRim }]}
      onLayout={(e) => {
        setW(e.nativeEvent.layout.width);
        setH(e.nativeEvent.layout.height);
      }}
    >
      {w > 0 && (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="remainingBase" x1="0.33" y1="0" x2="0.67" y2="1">
              <Stop offset="0" stopColor={colors.remainingGradFrom} />
              <Stop offset="0.58" stopColor={colors.remainingGradMid} />
              <Stop offset="1" stopColor={colors.remainingGradTo} />
            </LinearGradient>
            <RadialGradient id="remainingGlow" cx="1" cy="0" rx="1.3" ry="1.5" fx="1" fy="0">
              <Stop offset="0" {...stop(colors.remainingGlow)} />
              <Stop offset="0.52" {...stop(colors.remainingGlow)} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="remainingWarm" cx="0" cy="1" rx="0.9" ry="1.2" fx="0" fy="1">
              <Stop offset="0" {...stop(colors.remainingWarm)} />
              <Stop offset="0.6" {...stop(colors.remainingWarm)} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#remainingBase)" />
          <Rect width={w} height={h} fill="url(#remainingWarm)" />
          <Rect width={w} height={h} fill="url(#remainingGlow)" />
        </Svg>
      )}
      <View style={styles.top}>
        <View style={styles.headline}>
          <Text style={[styles.eyebrow, { color: colors.remainingLabel }]}>{label}</Text>
          <ScalarAmountText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.amount,
              { color: negative ? colors.remainingNegative : "#FFFFFF" },
            ]}
          >
            {value}
          </ScalarAmountText>
        </View>
        <Text numberOfLines={1} style={[styles.pill, { color: colors.remainingLabel }]}>
          {available}
        </Text>
      </View>
      <View style={[styles.rule, { backgroundColor: colors.remainingRule }]} />
      <View style={styles.stats}>
        {stats.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && (
              <View style={[styles.divider, { backgroundColor: colors.remainingRule }]} />
            )}
            <Pressable
              disabled={!stat.onInfo}
              onPress={stat.onInfo}
              hitSlop={6}
              accessibilityRole={stat.onInfo ? "button" : undefined}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <View style={styles.labelRow}>
                <Text
                  numberOfLines={1}
                  style={[styles.label, { color: colors.remainingLabel }]}
                >
                  {stat.label}
                </Text>
                {stat.onInfo && (
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={11}
                    color={colors.remainingLabel}
                  />
                )}
              </View>
              <ScalarAmountText
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.value,
                  { color: stat.negative ? colors.remainingNegative : "#FFFFFF" },
                ]}
              >
                {stat.value}
              </ScalarAmountText>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 9,
    borderRadius: 26,
    borderCurve: "continuous",
    borderWidth: 1,
    overflow: "hidden",
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  headline: { flexShrink: 1, minWidth: 0, gap: 2 },
  eyebrow: {
    fontFamily: designTokens.font.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.32,
    textTransform: "uppercase",
  },
  amount: {
    fontFamily: designTokens.font.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  pill: {
    height: 22,
    marginBottom: 4,
    paddingHorizontal: 9,
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
    fontFamily: designTokens.font.regular,
    fontSize: 12,
    lineHeight: 20,
  },
  rule: { height: 1 },
  stats: { flexDirection: "row", gap: 12 },
  divider: { width: 1 },
  cell: { flex: 1, minWidth: 0, gap: 6 },
  pressed: { opacity: 0.7 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  label: {
    flexShrink: 1,
    fontFamily: designTokens.font.semibold,
    fontSize: 10.5,
    lineHeight: 17,
    letterSpacing: 0.42,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: designTokens.font.display,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    fontVariant: ["tabular-nums"],
  },
});
