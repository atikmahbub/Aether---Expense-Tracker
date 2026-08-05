import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {getGreeting} from '@trackingPortal/utils/utils';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import dayjs from 'dayjs';
import React, {useEffect, useMemo} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {Avatar} from 'react-native-paper';
import {useRouter} from 'expo-router';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  FadeInLeft,
  FadeInRight
} from 'react-native-reanimated';
import {triggerSuccessHaptic} from '@trackingPortal/utils/haptic';
import SyncStatusIndicator from '@trackingPortal/components/SyncStatusIndicator';
import {designTokens} from '@trackingPortal/themes/designTokens';

const AVATAR_SIZE = 44;

const CustomAppBar: React.FC = () => {
  const {user} = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const greeting = React.useMemo(() => getGreeting(), []);
  const userName = React.useMemo(
    () => (user?.name as string)?.split(' ')[0] ?? '',
    [user],
  );
  const userPicture = React.useMemo(() => (user?.picture as string) ?? '', [user]);
  const userInitials = React.useMemo(() => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    return 'A';
  }, [userName]);
  const todayLabel = React.useMemo(() => dayjs().format('dddd, MMM D'), []);

  const handleProfilePress = React.useCallback(() => {
    triggerSuccessHaptic();
    router.push('/profile');
  }, [router]);

  const glowValue = useSharedValue(0.08);
  const glowScale = useSharedValue(1.08);
  useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(0.16, { duration: 2200 }),
        withTiming(0.08, { duration: 2200 })
      ),
      2,
      true
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 2200 }),
        withTiming(1.08, { duration: 2200 })
      ),
      2,
      true
    );
  }, [glowValue, glowScale]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowValue.value,
    transform: [{ scale: glowScale.value }],
  }));

  const timeIcon = React.useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12) return 'weather-sunset-up';
    if (hour < 18) return 'weather-sunny';
    return 'weather-night';
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInLeft.delay(100).duration(500)}
        style={styles.textBlock}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name={timeIcon} size={14} color={colors.panelTextSecondary} />
          <Text style={styles.dateLabel}>{todayLabel.toUpperCase()}</Text>
        </View>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
      </Animated.View>

      <SyncStatusIndicator />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleProfilePress}
        style={styles.avatarTapArea}>
        <Animated.View
          entering={FadeInRight.delay(200).duration(500)}
          style={styles.avatarContainer}>
          <View style={styles.avatarBorder}>
             {userPicture ? (
              <Avatar.Image
                size={AVATAR_SIZE}
                style={styles.avatarImage}
                source={{ uri: userPicture }}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{userInitials}</Text>
              </View>
            )}
          </View>
          <Animated.View style={[styles.avatarGlow, glowStyle]} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 0,
      minHeight: 60,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    textBlock: {
      flex: 1,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 3,
    },
    dateLabel: {
      color: colors.panelTextSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      fontFamily: designTokens.font.bold,
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 5,
    },
    greetingText: {
      color: colors.panelTextSecondary,
      fontSize: 21,
      lineHeight: 26,
      fontFamily: designTokens.font.regular,
      fontWeight: '400',
      letterSpacing: -0.4,
    },
    userNameText: {
      color: colors.panelText,
      fontSize: 21,
      lineHeight: 26,
      fontFamily: designTokens.font.extraBold,
      fontWeight: '800',
      letterSpacing: -0.7,
    },
    avatarTapArea: {
      padding: 2,
    },
    avatarContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarBorder: {
      width: AVATAR_SIZE + 4,
      height: AVATAR_SIZE + 4,
      borderRadius: (AVATAR_SIZE + 4) / 2,
      borderWidth: 2,
      borderColor: colors.panelText,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      zIndex: 2,
    },
    avatarImage: {
      backgroundColor: colors.panelTile,
    },
    avatarGlow: {
      position: 'absolute',
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.brand,
      zIndex: 1,
    },
    avatarFallback: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.panelTile,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: colors.primaryDark,
      fontSize: 16,
      fontWeight: '800',
      fontFamily: designTokens.font.extraBold,
    },
  });
}

export default React.memo(CustomAppBar);
