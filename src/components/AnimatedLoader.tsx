import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

const {width} = Dimensions.get('window');

const AnimatedLoader = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    );

    spinAnimation.start();
    return () => spinAnimation.stop();
  }, [rotation]);

  const animatedStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
      {
        scale: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        }),
      },
    ],
  };

  return (
    <View style={[styles.container, styles.backdrop]}>
      <Animated.View style={[styles.loader, animatedStyle]} />
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
    loader: {
      width: width * 0.2,
      height: width * 0.2,
      borderWidth: 5,
      borderRadius: width * 0.1,
      borderColor: colors.primary,
      borderTopColor: colors.accent,
    },
  });
}

export default AnimatedLoader;
