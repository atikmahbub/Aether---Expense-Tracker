import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { colors } from '@trackingPortal/themes/colors';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount, syncNow, syncInProgress } = useOffline();
  const insets = useSafeAreaInsets();
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  const shouldShow = !isOnline || pendingCount > 0;

  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 12,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow, opacity, translateY]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity, 
          transform: [{ translateY }],
          top: insets.top + 8 
        }
      ]}
    >
      <BlurView intensity={25} tint="dark" style={styles.blurWrapper}>
        <View style={styles.content}>
          <View style={styles.statusRow}>
            {!isOnline ? (
              <View style={styles.offlineIndicator}>
                <MaterialCommunityIcons name="cloud-off-outline" size={16} color={colors.error} />
                <Text style={styles.statusText}>OFFLINE MODE</Text>
              </View>
            ) : (
              <View style={styles.onlineIndicator}>
                <MaterialCommunityIcons name="cloud-sync-outline" size={18} color={colors.primary} />
                <Text style={styles.onlineStatusText}>SYNC PENDING</Text>
              </View>
            )}
            {pendingCount > 0 && (
              <View style={styles.pendingIndicator}>
                <Text style={styles.pendingText}>
                  {pendingCount} item{pendingCount > 1 ? 's' : ''} to sync
                </Text>
              </View>
            )}
          </View>

          {pendingCount > 0 && isOnline && (
            <Pressable
              onPress={syncNow}
              disabled={syncInProgress}
              style={({ pressed }) => [
                styles.syncButton,
                pressed && styles.syncButtonPressed,
                syncInProgress && styles.syncButtonDisabled,
              ]}
            >
              <Text style={styles.syncButtonText}>
                {syncInProgress ? 'Syncing...' : 'Sync Now'}
              </Text>
            </Pressable>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  blurWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    backgroundColor: 'rgba(21, 23, 27, 0.75)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusRow: {
    flex: 1,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusText: {
    color: colors.error,
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '800',
    letterSpacing: 1,
  },
  onlineStatusText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '800',
    letterSpacing: 1,
  },
  pendingIndicator: {
    marginTop: 1,
  },
  pendingText: {
    color: colors.subText,
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
});

export default OfflineBanner;
