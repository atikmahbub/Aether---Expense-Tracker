import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '@trackingPortal/themes/colors';

interface CircularProgressProps {
  progress: number; // value between 0 and 1
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 56,
  strokeWidth = 5,
  trackColor = colors.surfaceAlt,
  progressColor = colors.accent,
  label,
}) => {
  const clamped = useMemo(
    () => Math.max(0, Math.min(progress, 1)),
    [progress],
  );

  const animatedProgress = useRef(new Animated.Value(clamped)).current;

  const radius = useMemo(
    () => (size - strokeWidth) / 2,
    [size, strokeWidth],
  );
  const circumference = useMemo(
    () => 2 * Math.PI * radius,
    [radius],
  );
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, clamped]);

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Svg width={size} height={size}>
        <Circle
          stroke={trackColor}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          stroke={progressColor}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={[
          styles.labelContainer,
          {
            width: size - strokeWidth * 2 - 6,
            height: size - strokeWidth * 2 - 6,
            borderRadius: (size - strokeWidth * 2 - 6) / 2,
          },
        ]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default CircularProgress;
