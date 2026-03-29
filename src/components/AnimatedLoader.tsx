import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import LottieView from 'lottie-react-native';
import {colors} from '@trackingPortal/themes/colors';

const AppLoader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.loaderCard}>
        <LottieView
          source={require('@trackingPortal/assets/loader2.json')}
          autoPlay={true}
          loop
          style={styles.loader}
        />
        <Text style={styles.loaderLabel}>Warming up Aether…</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default AppLoader;
