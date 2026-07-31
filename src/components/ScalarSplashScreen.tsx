import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

import AnimatedLoader from "@trackingPortal/components/AnimatedLoader";

type ScalarSplashScreenProps = {
  isDark: boolean;
  fontsLoaded?: boolean;
  exiting?: boolean;
  onLayout?: () => void;
};

/**
 * The launch state uses the same ledger-settling language as every full-screen
 * wait. Theme and font readiness are handled by ScalarSplashGate.
 */
const ScalarSplashScreen: React.FC<ScalarSplashScreenProps> = ({
  exiting = false,
  onLayout,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!exiting) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [exiting, opacity]);

  return (
    <Animated.View
      style={[styles.container, { opacity }]}
      onLayout={onLayout}
      pointerEvents={exiting ? "none" : "auto"}
    >
      <AnimatedLoader />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});

export default ScalarSplashScreen;
