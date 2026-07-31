import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";

const DIGITS = ["3", "7", "1", "9", "4", "3"];

type RollingDigitProps = {
  size?: "compact" | "large";
  duration?: number;
  color?: string;
};

export const RollingDigit: React.FC<RollingDigitProps> = ({
  size = "compact",
  duration = 820,
  color,
}) => {
  const { colors } = useAppTheme();
  const translate = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const large = size === "large";
  const rowHeight = large ? 44 : 24;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      translate.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(translate, {
        toValue: -rowHeight * (DIGITS.length - 1),
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, reduceMotion, rowHeight, translate]);

  const styles = useMemo(
    () => makeDigitStyles(rowHeight, large, color ?? colors.textPrimary),
    [color, colors.textPrimary, large, rowHeight],
  );

  if (reduceMotion) {
    return <View style={[styles.window, styles.staticMark]} />;
  }

  return (
    <View style={styles.window}>
      <Animated.View style={{ transform: [{ translateY: translate }] }}>
        {DIGITS.map((digit, index) => (
          <Animated.Text key={`${digit}-${index}`} style={styles.digit}>
            {digit}
          </Animated.Text>
        ))}
      </Animated.View>
    </View>
  );
};

export const LoadingSquares: React.FC<{ color?: string }> = ({ color }) => {
  const { colors } = useAppTheme();
  const values = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0)),
  ).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loops = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(value, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((2 - index) * 160),
        ]),
      ),
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [reduceMotion, values]);

  return (
    <View style={squareStyles.row}>
      {values.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            squareStyles.square,
            {
              backgroundColor: color ?? colors.onBrand,
              opacity: reduceMotion
                ? 0.6
                : value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.28, 1],
                  }),
              transform: [
                {
                  scale: reduceMotion
                    ? 1
                    : value.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.82, 1],
                      }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

function makeDigitStyles(rowHeight: number, large: boolean, color: string) {
  return StyleSheet.create({
    window: {
      width: large ? 25 : 15,
      height: rowHeight,
      overflow: "hidden",
      alignItems: "center",
    },
    digit: {
      width: large ? 25 : 15,
      height: rowHeight,
      lineHeight: rowHeight,
      color,
      fontFamily: designTokens.font.bold,
      fontSize: large ? 38 : 18,
      fontWeight: "700",
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    staticMark: {
      width: large ? 18 : 11,
      height: large ? 3 : 2,
      marginHorizontal: large ? 3.5 : 2,
      marginVertical: (rowHeight - (large ? 3 : 2)) / 2,
      borderRadius: 2,
      backgroundColor: color,
      opacity: 0.6,
    },
  });
}

const squareStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  square: { width: 8, height: 8, borderRadius: 2 },
});
