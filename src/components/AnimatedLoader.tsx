import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const ORBIT_RADIUS = width * 0.08;
const DOT_COUNT = 8;
const DOT_SIZE = width * 0.028;

const AnimatedLoader = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const dotAnimations = useRef(
    Array.from({ length: DOT_COUNT }, () => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
    })),
  ).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );

    const dotWaves = dotAnimations.map((dot, index) => {
      const delay = index * 150;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(dot.opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot.scale, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(dot.opacity, {
              toValue: 0.2,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot.scale, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay((DOT_COUNT - index - 1) * 150),
        ]),
      );
    });

    spin.start();
    pulse.start();
    dotWaves.forEach(wave => wave.start());

    return () => {
      spin.stop();
      pulse.stop();
      dotWaves.forEach(wave => wave.stop());
    };
  }, [spinValue, pulseValue, dotAnimations]);

  const rotation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const centerScale = pulseValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 1.15, 0.85],
  });

  const centerOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={[styles.container, styles.backdrop]}>
      <View style={styles.card}>
        <View style={styles.loaderWrapper}>
          <Animated.View
            style={[
              styles.orbitRing,
              {
                opacity: pulseValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.3],
                }),
              },
            ]}
          />
          <Animated.View
            style={[styles.orbitContainer, { transform: [{ rotate: rotation }] }]}
          >
            {dotAnimations.map((dot, index) => {
              const angle = (index / DOT_COUNT) * 360;
              const x = Math.cos((angle * Math.PI) / 180) * ORBIT_RADIUS;
              const y = Math.sin((angle * Math.PI) / 180) * ORBIT_RADIUS;
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.orbitDot,
                    {
                      transform: [
                        { translateX: x },
                        { translateY: y },
                        { scale: dot.scale },
                      ],
                      opacity: dot.opacity,
                    },
                  ]}
                />
              );
            })}
          </Animated.View>
          <Animated.View
            style={[
              styles.centerCore,
              {
                transform: [{ scale: centerScale }],
                opacity: centerOpacity,
              },
            ]}
          >
            <View style={styles.centerInner} />
          </Animated.View>
        </View>
        <View style={styles.barContainer}>
          <Animated.View
            style={[
              styles.bar,
              {
                opacity: pulseValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              styles.barMiddle,
              {
                opacity: pulseValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 0.3],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                opacity: pulseValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      backgroundColor: colors.overlay,
    },
    card: {
      alignItems: 'center',
      paddingVertical: 36,
      paddingHorizontal: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      shadowColor: colors.overlay,
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
      gap: 20,
    },
    loaderWrapper: {
      width: ORBIT_RADIUS * 2 + DOT_SIZE * 2,
      height: ORBIT_RADIUS * 2 + DOT_SIZE * 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    orbitRing: {
      position: 'absolute',
      width: ORBIT_RADIUS * 2,
      height: ORBIT_RADIUS * 2,
      borderRadius: ORBIT_RADIUS,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    orbitContainer: {
      position: 'absolute',
      width: ORBIT_RADIUS * 2 + DOT_SIZE * 2,
      height: ORBIT_RADIUS * 2 + DOT_SIZE * 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    orbitDot: {
      position: 'absolute',
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.6,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 0 },
    },
    centerCore: {
      position: 'absolute',
      width: DOT_SIZE * 2.5,
      height: DOT_SIZE * 2.5,
      borderRadius: DOT_SIZE * 1.25,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerInner: {
      width: DOT_SIZE * 1.2,
      height: DOT_SIZE * 1.2,
      borderRadius: DOT_SIZE * 0.6,
      backgroundColor: colors.primary,
    },
    barContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bar: {
      width: 24,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.primary,
    },
    barMiddle: {
      width: 32,
    },
  });
}

export default AnimatedLoader;
