import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

/**
 * Compact replacement for the old bottom-of-screen offline/sync banners —
 * lives in the app bar instead so it never overlaps the tab bar. Renders
 * nothing once the app is online and fully synced.
 */
const SyncStatusIndicator: React.FC = () => {
  const { isOnline, pendingCount, syncInProgress } = useOffline();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (syncInProgress) {
      spin.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(spin);
      spin.value = 0;
    }
    return () => cancelAnimation(spin);
  }, [syncInProgress, spin]);

  useEffect(() => {
    if (!isOnline) {
      pulse.value = withRepeat(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
    return () => cancelAnimation(pulse);
  }, [isOnline, pulse]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  if (isOnline && !syncInProgress && pendingCount === 0) {
    return null;
  }

  let icon: string;
  let label: string;
  let tint: string;
  let animatedStyle = {};

  if (!isOnline) {
    icon = 'cloud-off-outline';
    label = 'Offline';
    tint = colors.error;
    animatedStyle = pulseStyle;
  } else if (syncInProgress) {
    icon = 'cloud-sync-outline';
    label = 'Syncing';
    tint = colors.primary;
    animatedStyle = spinStyle;
  } else {
    icon = 'cloud-upload-outline';
    label = `${pendingCount} pending`;
    tint = colors.warning;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons name={icon} size={16} color={tint} />
      </Animated.View>
      <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      marginRight: 10,
    },
    label: {
      fontSize: 10,
      fontFamily: 'Manrope',
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}

export default React.memo(SyncStatusIndicator);
