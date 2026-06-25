import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScalarSpinner from '@trackingPortal/components/ScalarSpinner';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH * 0.56;

/**
 * Full-screen, one-time migration screen shown to existing users on the first
 * launch of the offline-first build while their cloud data is downloaded into
 * SQLite. Driven by `useOffline().isMigrating`; it never shows again after the
 * first successful sync (the completion flag is persisted in SQLite).
 */
const MigrationOverlay: React.FC = () => {
  const { isMigrating, migrationProgress } = useOffline();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const barAnim = useRef(new Animated.Value(0)).current;

  const progress = migrationProgress?.progress ?? 0;
  const step = migrationProgress?.step ?? 'Preparing…';
  const pct = Math.min(Math.round(progress * 100), 100);

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, barAnim]);

  if (!isMigrating) return null;

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH],
  });

  return (
    <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <ScalarSpinner size={80} />
        <Text style={styles.title}>Setting up offline mode</Text>
        <Text style={styles.step}>{step}</Text>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      zIndex: 10000,
      elevation: 10000,
    },
    content: {
      alignItems: 'center',
      gap: 12,
      width: BAR_WIDTH + 64,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      fontFamily: 'Manrope',
      letterSpacing: -0.4,
      marginTop: 8,
      textAlign: 'center',
    },
    step: {
      color: colors.subText,
      fontSize: 13,
      fontFamily: 'Manrope',
      textAlign: 'center',
      marginTop: 4,
    },
    barTrack: {
      width: BAR_WIDTH,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceAlt,
      marginTop: 12,
      overflow: 'hidden',
    },
    barFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    pct: {
      color: colors.subText,
      fontSize: 12,
      fontFamily: 'Manrope',
      fontWeight: '600',
      marginTop: 4,
    },
  });
}

export default MigrationOverlay;
