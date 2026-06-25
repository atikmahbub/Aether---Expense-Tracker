import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

interface ScalarSpinnerProps {
  /** Overall diameter in px. */
  size?: number;
}

/**
 * Sleek brand loader: two counter-rotating arcs around a softly pulsing,
 * glowing core. Pure RN Animated (native driver), no Lottie.
 */
const ScalarSpinner: React.FC<ScalarSpinnerProps> = ({ size = 72 }) => {
  const { colors } = useAppTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const rotateReverse = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const coreScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.08] });
  const coreOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  const outer = size;
  const inner = size * 0.6;
  const core = size * 0.24;
  const outerBorder = Math.max(3, size * 0.05);
  const innerBorder = Math.max(2, size * 0.045);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth: outerBorder,
          borderColor: 'transparent',
          borderTopColor: colors.primary,
          borderRightColor: colors.primaryMid,
          transform: [{ rotate }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          borderWidth: innerBorder,
          borderColor: 'transparent',
          borderBottomColor: colors.secondary,
          borderLeftColor: colors.primary,
          transform: [{ rotate: rotateReverse }],
        }}
      />
      <Animated.View
        style={{
          width: core,
          height: core,
          borderRadius: core / 2,
          backgroundColor: colors.primary,
          opacity: coreOpacity,
          transform: [{ scale: coreScale }],
          shadowColor: colors.primary,
          shadowOpacity: 0.9,
          shadowRadius: size * 0.18,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }}
      />
    </View>
  );
};

export default ScalarSpinner;
