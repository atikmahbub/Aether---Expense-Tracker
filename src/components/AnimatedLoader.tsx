import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { RollingDigit } from "@trackingPortal/components/ScalarLoadingMarks";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

const COLUMN_DURATIONS = [1050, 820, 1280, 940, 1160, 760];

const AnimatedLoader: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>scalar</Text>
        <View style={styles.brandDot} />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.currency}>৳</Text>
        {COLUMN_DURATIONS.slice(0, 3).map(duration => (
          <RollingDigit key={duration} size="large" duration={duration} />
        ))}
        <Text style={styles.comma}>,</Text>
        {COLUMN_DURATIONS.slice(3).map(duration => (
          <RollingDigit key={duration} size="large" duration={duration} />
        ))}
      </View>

      <View style={styles.status}>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.progress,
              {
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-82, 172],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.caption}>BALANCING YOUR LEDGER</Text>
      </View>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 34,
      backgroundColor: colors.background,
    },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    brand: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.extraBold,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.72,
    },
    brandDot: {
      width: 9,
      height: 9,
      borderRadius: 2,
      backgroundColor: colors.brand,
    },
    amountRow: { flexDirection: "row", alignItems: "center", gap: 1 },
    currency: {
      marginRight: 4,
      color: colors.textTertiary,
      fontFamily: designTokens.font.bengali,
      fontSize: 30,
      lineHeight: 44,
      fontWeight: "700",
    },
    comma: {
      width: 12,
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontSize: 38,
      lineHeight: 44,
      fontWeight: "700",
      textAlign: "center",
    },
    status: { alignItems: "center", gap: 16 },
    track: {
      width: 132,
      height: 3,
      borderRadius: 2,
      overflow: "hidden",
      backgroundColor: colors.border,
    },
    progress: {
      width: 50,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.brand,
    },
    caption: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700",
      letterSpacing: 1.68,
    },
  });
}

export default AnimatedLoader;
