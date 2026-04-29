import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '@trackingPortal/themes/colors';

interface CircularProgressProps {
  progress: number; // value can be > 1
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 56,
  strokeWidth = 4,
  label,
}) => {
  const isExceeded = progress > 1;
  const clamped = useMemo(() => Math.max(0, Math.min(progress, 1)), [progress]);
  
  const progressColor = isExceeded ? colors.error : colors.primary;
  const trackColor = 'rgba(255, 255, 255, 0.04)';

  const animatedProgress = useRef(new Animated.Value(0)).current;

  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped]);

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
      <View style={styles.labelContainer}>
        {label ? (
          <Text style={[styles.label, { color: isExceeded ? colors.error : colors.text }]}>
            {label}
          </Text>
        ) : null}
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
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
});

export default CircularProgress;
