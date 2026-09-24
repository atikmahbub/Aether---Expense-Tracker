import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Pattern,
  Rect,
  Stop,
} from "react-native-svg";

import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

const TRACK = 64;

/** Dotted remainder: 12pt grid of soft dots, clipped to its box. */
export function DotField({
  color,
  spacing = 12,
  radius = 2.2,
}: {
  color: string;
  spacing?: number;
  radius?: number;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id={`dots${id}`}
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <Circle cx={spacing / 2} cy={spacing / 2} r={radius} fill={color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#dots${id})`} />
    </Svg>
  );
}

// SVG stops drop the alpha of an rgba() colour, so split it into
// stopColor + stopOpacity.
function stopProps(color: string) {
  const m = color.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
  if (!m) return { stopColor: color, stopOpacity: 1 };
  return { stopColor: `rgb(${m[1]},${m[2]},${m[3]})`, stopOpacity: Number(m[4]) };
}

/** Horizontal fade from nearly transparent into the spent colour. */
export function SpentRamp({ from, to }: { from: string; to: string }) {
  const id = React.useId().replace(/:/g, "");
  // Size the SVG in real pixels: percentage sizing leaves it at its intrinsic
  // width on some devices, so the fade stops short of the knob.
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={`ramp${id}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" {...stopProps(from)} />
              <Stop offset="1" {...stopProps(to)} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#ramp${id})`} />
        </Svg>
      ) : null}
    </View>
  );
}

function Knob({
  label,
  bg,
  ink,
  size,
}: {
  label: string;
  bg: string;
  ink: string;
  size: number;
}) {
  return (
    <View
      style={[
        styles.knob,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.knobText, { color: ink, fontSize: size > 50 ? 13 : 11 }]}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Spent vs left against the monthly limit. The spent share is a ramp that
 * ends in a filled knob; the remainder is a dotted field that starts with an
 * ink knob. Past the limit the whole bar is spent and the knob turns negative.
 */
export default function SplitBar({
  ratio,
  limitLabel,
  leftLabel,
  leftAmount,
}: {
  ratio: number;
  limitLabel: string;
  leftLabel: string;
  leftAmount: string;
}) {
  const { colors } = useAppTheme();
  const over = ratio >= 1;
  const spentPct = Math.round(ratio * 100);
  // Keep both knobs legible at the extremes; the knob labels carry the truth.
  // The cap keeps the remainder wide enough for a 6-digit "Left" figure.
  const spentFr = over ? 1 : Math.min(Math.max(ratio, 0.22), 0.6);
  // Once the remainder gets narrow, the limit caption moves to the spent side.
  const limitOnSpent = !over && spentFr >= 0.45;

  return (
    <View style={styles.grid}>
      <View
        style={[
          styles.cell,
          { flex: spentFr, borderLeftColor: colors.heroRule },
          over && { borderRightWidth: 1, borderRightColor: colors.heroRule },
        ]}
      >
        <View style={[styles.head, over || limitOnSpent ? styles.headSplit : styles.headEnd]}>
          {over ? (
            <>
              <ScalarAmountText style={[styles.caption, { color: colors.heroTextSecondary }]}>
                {limitLabel}
              </ScalarAmountText>
              <View style={styles.leftBlock}>
                <Text style={[styles.caption, { color: colors.heroTextSecondary }]}>
                  {leftLabel}
                </Text>
                <ScalarAmountText style={[styles.leftAmount, { color: colors.negative }]}>
                  {leftAmount}
                </ScalarAmountText>
              </View>
            </>
          ) : (
            <>
              {limitOnSpent ? (
                <ScalarAmountText
                  numberOfLines={1}
                  style={[styles.caption, styles.limit, { color: colors.heroTextSecondary }]}
                >
                  {limitLabel}
                </ScalarAmountText>
              ) : null}
              <Text style={[styles.caption, { color: colors.heroTextSecondary }]}>Spent</Text>
            </>
          )}
        </View>
        <View style={[styles.track, styles.spentTrack]}>
          <SpentRamp from={colors.splitSpentFrom} to={over ? colors.negative : colors.splitSpentTo} />
          <Knob
            label={`${spentPct}%`}
            bg={over ? colors.negativeFill : colors.splitSpentKnob}
            ink={over ? colors.onNegativeFill : colors.splitSpentKnobInk}
            size={62}
          />
        </View>
      </View>
      {!over && (
        <View
          style={[
            styles.cell,
            {
              flex: 1 - spentFr,
              borderLeftColor: colors.heroRule,
              borderRightWidth: 1,
              borderRightColor: colors.heroRule,
            },
          ]}
        >
          <View
            style={[
              styles.head,
              limitOnSpent ? styles.headEnd : styles.headSplit,
              { paddingLeft: 12 },
            ]}
          >
            {!limitOnSpent && (
              <ScalarAmountText
                numberOfLines={1}
                style={[styles.caption, styles.limit, { color: colors.heroTextSecondary }]}
              >
                {limitLabel}
              </ScalarAmountText>
            )}
            <View style={styles.leftBlock}>
              <Text style={[styles.caption, { color: colors.heroTextSecondary }]}>
                {leftLabel}
              </Text>
              <ScalarAmountText style={[styles.leftAmount, { color: colors.heroText }]}>
                {leftAmount}
              </ScalarAmountText>
            </View>
          </View>
          <View style={styles.track}>
            <View style={styles.dotsInset}>
              <DotField color={colors.heroDots} />
            </View>
            <Knob
              label={`${100 - spentPct}%`}
              bg={colors.splitLeftKnob}
              ink={colors.splitLeftKnobInk}
              size={62}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", height: 118 },
  cell: {
    borderLeftWidth: 1,
    justifyContent: "space-between",
  },
  head: { paddingTop: 4, paddingHorizontal: 8, flexDirection: "row" },
  headEnd: { justifyContent: "flex-end" },
  headSplit: { justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
  caption: { fontFamily: designTokens.font.regular, fontSize: 12, lineHeight: 16 },
  limit: { flexShrink: 1 },
  leftBlock: { alignItems: "flex-end", gap: 2 },
  leftAmount: {
    fontFamily: designTokens.font.display,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: TRACK,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  spentTrack: {
    justifyContent: "flex-end",
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  dotsInset: { ...StyleSheet.absoluteFillObject, left: 70 },
  knob: { alignItems: "center", justifyContent: "center" },
  knobText: { fontFamily: designTokens.font.display },
});
