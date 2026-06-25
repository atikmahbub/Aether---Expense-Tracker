import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScalarSpinner from '@trackingPortal/components/ScalarSpinner';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

/**
 * Full-screen, one-time migration screen shown to existing users on the first
 * launch of the offline-first build while their cloud data is downloaded into
 * SQLite. Driven by `useOffline().isMigrating`; it never shows again after the
 * first successful sync (the completion flag is persisted in SQLite).
 */
const MigrationOverlay: React.FC = () => {
  const { isMigrating } = useOffline();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!isMigrating) return null;

  return (
    <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <ScalarSpinner size={80} />
        <Text style={styles.title}>Setting up offline mode</Text>
        <Text style={styles.subtitle}>
          Syncing your data so Scalar works even without internet.
          {'\n'}This happens only once.
        </Text>
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
      gap: 16,
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
    subtitle: {
      color: colors.subText,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Manrope',
      textAlign: 'center',
    },
  });
}

export default MigrationOverlay;
