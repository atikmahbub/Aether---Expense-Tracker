import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SPLASH_LAYOUT, SPLASH_THEME, type SplashPalette } from '@trackingPortal/constants/splash';

type ScalarSplashScreenProps = {
  isDark: boolean;
  fontsLoaded?: boolean;
  exiting?: boolean;
  onLayout?: () => void;
};

const ScalarSplashScreen: React.FC<ScalarSplashScreenProps> = ({
  isDark,
  fontsLoaded = false,
  exiting = false,
  onLayout,
}) => {
  const palette = isDark ? SPLASH_THEME.dark : SPLASH_THEME.light;
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.72);
  const logoOpacity = useSharedValue(0);
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const ripple3 = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(14);
  const subtitleOpacity = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.9 });

    // Expanding "sonar" ripple rings, staggered for a continuous outward pulse.
    const rippleConfig = { duration: 2600, easing: Easing.out(Easing.cubic) };
    ripple1.value = withRepeat(withTiming(1, rippleConfig), -1, false);
    ripple2.value = withDelay(866, withRepeat(withTiming(1, rippleConfig), -1, false));
    ripple3.value = withDelay(1733, withRepeat(withTiming(1, rippleConfig), -1, false));

    titleOpacity.value = withDelay(220, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    titleTranslateY.value = withDelay(
      220,
      withSpring(0, { damping: 16, stiffness: 140 }),
    );

    subtitleOpacity.value = withDelay(380, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));

    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.15, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [ripple1, ripple2, ripple3, logoOpacity, logoScale, progress, subtitleOpacity, titleOpacity, titleTranslateY]);

  useEffect(() => {
    if (!exiting) return;
    containerOpacity.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [containerOpacity, exiting]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ripple1.value, [0, 0.1, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(ripple1.value, [0, 1], [0.5, 1.55]) }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ripple2.value, [0, 0.1, 1], [0, 0.4, 0]),
    transform: [{ scale: interpolate(ripple2.value, [0, 1], [0.5, 1.55]) }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    opacity: interpolate(ripple3.value, [0, 0.1, 1], [0, 0.3, 0]),
    transform: [{ scale: interpolate(ripple3.value, [0, 1], [0.5, 1.55]) }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, SPLASH_LAYOUT.progressBarWidth]),
  }));

  const fontFamily = fontsLoaded ? 'Manrope_700Bold' : undefined;
  const subtitleFontFamily = fontsLoaded ? 'Manrope_600SemiBold' : undefined;

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
      onLayout={onLayout}
      pointerEvents={exiting ? 'none' : 'auto'}
    >
      <View style={styles.rippleLayer} pointerEvents="none">
        <View style={styles.softGlow} />
        <Animated.View style={[styles.ring, ring1Style]} />
        <Animated.View style={[styles.ring, ring2Style]} />
        <Animated.View style={[styles.ring, ring3Style]} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.logoBadge, logoStyle]}>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          style={[styles.appName, titleStyle, fontFamily ? { fontFamily } : null]}
        >
          SCALAR
        </Animated.Text>

        <Animated.Text
          style={[styles.subtitle, subtitleStyle, subtitleFontFamily ? { fontFamily: subtitleFontFamily } : null]}
        >
          ELEVATED FINANCE
        </Animated.Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>
    </Animated.View>
  );
};

function makeStyles(palette: SplashPalette) {
  const { logoBadgeSize, logoIconSize, logoBorderRadius, glowSize, contentGap } = SPLASH_LAYOUT;

  return StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.background,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    rippleLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    softGlow: {
      position: 'absolute',
      width: glowSize,
      height: glowSize,
      borderRadius: glowSize / 2,
      backgroundColor: palette.glow,
    },
    ring: {
      position: 'absolute',
      width: glowSize * 0.62,
      height: glowSize * 0.62,
      borderRadius: (glowSize * 0.62) / 2,
      borderWidth: 1.5,
      borderColor: palette.primary,
    },
    content: {
      alignItems: 'center',
      gap: contentGap,
    },
    logoBadge: {
      width: logoBadgeSize,
      height: logoBadgeSize,
      borderRadius: logoBorderRadius,
      backgroundColor: palette.surfaceAlt,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: palette.primary,
      shadowOpacity: 0.22,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
      marginBottom: 4,
    },
    logoIcon: {
      width: logoIconSize,
      height: logoIconSize,
      borderRadius: 14,
    },
    appName: {
      color: palette.text,
      fontSize: SPLASH_LAYOUT.appNameSize,
      fontWeight: '800',
      letterSpacing: SPLASH_LAYOUT.appNameLetterSpacing,
    },
    subtitle: {
      color: palette.muted,
      fontSize: SPLASH_LAYOUT.subtitleSize,
      fontWeight: '700',
      letterSpacing: SPLASH_LAYOUT.subtitleLetterSpacing,
      marginTop: -8,
    },
    progressTrack: {
      width: SPLASH_LAYOUT.progressBarWidth,
      height: SPLASH_LAYOUT.progressBarHeight,
      borderRadius: SPLASH_LAYOUT.progressBarHeight,
      backgroundColor: palette.progressTrack,
      overflow: 'hidden',
      marginTop: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: SPLASH_LAYOUT.progressBarHeight,
      backgroundColor: palette.primary,
    },
  });
}

export default ScalarSplashScreen;
