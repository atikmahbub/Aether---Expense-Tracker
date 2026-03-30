import React, {useEffect, useRef} from 'react';
import {Animated, Platform, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNetwork} from '@trackingPortal/contexts/NetworkProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const OfflineBanner: React.FC = () => {
  const {isOnline} = useNetwork();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (!isOnline) {
      // Slide in + fade in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 20,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out + fade out
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOnline, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity,
          transform: [{translateY}],
          top: insets.top + 8,
        },
      ]}
      pointerEvents="none">
      <View style={styles.inner}>
        <MaterialCommunityIcons
          name="cloud-off-outline"
          size={16}
          color="#FF6B6B"
        />
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </Animated.View>
  );
};

export default OfflineBanner;

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: {width: 0, height: 6},
      },
      android: {
        elevation: 12,
      },
    }),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1b2026',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.30)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
