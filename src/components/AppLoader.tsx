import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ScalarSpinner from '@trackingPortal/components/ScalarSpinner';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

const AppLoader = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.loaderCard}>
        <ScalarSpinner size={72} />
        <Text style={styles.loaderLabel}>Warming up Scalar…</Text>
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
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    loaderCard: {
      width: 220,
      borderRadius: 32,
      paddingVertical: 32,
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.surface,
      shadowColor: colors.overlay,
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: {width: 0, height: 16},
    },
    loader: {
      width: 150,
      height: 150,
    },
    loaderLabel: {
      color: colors.text,
      fontSize: 14,
      letterSpacing: 0.4,
    },
  });
}

export default AppLoader;
