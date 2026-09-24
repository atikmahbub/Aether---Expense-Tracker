import dayjs from "dayjs";
import * as Font from "expo-font";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DotField, SpentRamp } from "@trackingPortal/components/scalar/SplitBar";
import ScreenGradient from "@trackingPortal/components/scalar/ScreenGradient";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

const BAR_WIDTH = 220;
const KNOB = 44;

/** Wordmark plus the Wallet hero's split bar, filling as data loads. */
const AnimatedLoader: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = React.useState(20);

  useEffect(() => {
    const id = progress.addListener(({ value }) =>
      setPct(Math.round(20 + value * 70)),
    );
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      progress.removeListener(id);
    };
  }, [progress]);

  // Re-read every frame (the % label re-renders), so it flips as soon as the
  // font lands.
  const displayReady = Font.isLoaded(designTokens.font.display);

  const spentWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [BAR_WIDTH * 0.2, BAR_WIDTH * 0.9],
  });

  return (
    <View style={styles.container}>
      <ScreenGradient />
      <View style={styles.center}>
        {/* This also renders as the launch splash, before fonts finish
            loading. Android keeps the width measured for the fallback face
            when Unbounded swaps in and clips the word, so remount it once
            the font is ready and let it span the full width. */}
        <Text
          key={displayReady ? "display" : "fallback"}
          numberOfLines={1}
          style={[styles.brand, !displayReady && styles.brandFallback]}
        >
          scalar
        </Text>
        <View style={styles.bar}>
          <Animated.View style={[styles.spent, { width: spentWidth }]}>
            {/* Drawn at full bar width and clipped by the growing fill: an SVG
                sized to an animating parent doesn't redraw on every frame. */}
            <View style={styles.ramp}>
              <SpentRamp from={colors.loaderFrom} to={colors.loaderTo} />
            </View>
            <View style={styles.knob}>
              <Text style={styles.knobText}>{pct}%</Text>
            </View>
          </Animated.View>
          <View style={[styles.rest, { flex: 1 }]}>
            <View style={styles.dots}>
              <DotField color={colors.heroDots} spacing={10} radius={2} />
            </View>
          </View>
        </View>
        <Text style={styles.caption}>Syncing your {dayjs().format("MMMM")}…</Text>
      </View>
      <Text style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 28 }]}>
        Offline-first · your entries are saved on this device
      </Text>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: colors.heroGradBottom,
    },
    center: {
      flex: 1,
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
    },
    brand: {
      alignSelf: "stretch",
      textAlign: "center",
      color: colors.heroInk,
      fontFamily: designTokens.font.display,
      fontSize: 40,
      lineHeight: 50,
      letterSpacing: -1.2,
    },
    brandFallback: { fontFamily: undefined, fontWeight: "600", letterSpacing: -0.5 },
    bar: { width: BAR_WIDTH, height: KNOB, flexDirection: "row" },
    spent: {
      height: KNOB,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      borderTopLeftRadius: 999,
      borderBottomLeftRadius: 999,
      overflow: "hidden",
    },
    dots: { position: "absolute", right: 0, top: 0, bottom: 0, width: BAR_WIDTH },
    ramp: { position: "absolute", left: 0, top: 0, bottom: 0, width: BAR_WIDTH },
    knob: {
      width: KNOB,
      height: KNOB,
      borderRadius: KNOB / 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.loaderKnob,
    },
    knobText: {
      color: colors.loaderKnobInk,
      fontFamily: designTokens.font.display,
      fontSize: 11,
    },
    rest: {
      flex: 1,
      overflow: "hidden",
      borderTopRightRadius: 999,
      borderBottomRightRadius: 999,
    },
    caption: {
      color: colors.heroTextSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 15,
    },
    footer: {
      color: colors.textMuted,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
    },
  });
}

export default AnimatedLoader;
