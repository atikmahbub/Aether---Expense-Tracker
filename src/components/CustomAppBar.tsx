import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {getGreeting} from '@trackingPortal/utils/utils';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import dayjs from 'dayjs';
import React, {useMemo} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Platform} from 'react-native';
import {Avatar} from 'react-native-paper';
import {useRouter} from 'expo-router';
import Animated, {FadeInLeft, FadeInRight} from 'react-native-reanimated';
import {triggerSuccessHaptic} from '@trackingPortal/utils/haptic';
import SyncStatusIndicator from '@trackingPortal/components/SyncStatusIndicator';
import {designTokens} from '@trackingPortal/themes/designTokens';

const AVATAR_SIZE = 48;

interface CustomAppBarProps {
  /** Replaces the greeting with a wide-face screen title (Settings). */
  title?: string;
  /** Small line above the title; defaults to today's date. */
  subtitle?: string;
}

const CustomAppBar: React.FC<CustomAppBarProps> = ({title, subtitle}) => {
  const {user} = useAuth();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

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

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInLeft.delay(100).duration(500)}
        style={styles.textBlock}>
        <Text style={styles.dateLabel}>{subtitle ?? todayLabel}</Text>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <Text style={styles.greetingText} numberOfLines={1}>
            {greeting},{' '}
            <Text style={styles.userNameText}>{userName}</Text>
          </Text>
        )}
      </Animated.View>

      <SyncStatusIndicator />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleProfilePress}
        style={styles.avatarTapArea}>
        <Animated.View
          entering={FadeInRight.delay(200).duration(500)}
          style={styles.avatarBorder}>
          {userPicture ? (
            <Avatar.Image
              size={AVATAR_SIZE - 4}
              style={styles.avatarImage}
              source={{ uri: userPicture }}
            />
          ) : (
            <Text style={styles.avatarInitial}>{userInitials}</Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 22,
      paddingTop: 6,
      minHeight: 54,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    dateLabel: {
      color: colors.heroTextSecondary,
      fontSize: 13,
      lineHeight: 17,
      fontFamily: designTokens.font.medium,
    },
    greetingText: {
      color: colors.heroText,
      fontSize: 20,
      lineHeight: 26,
      fontFamily: designTokens.font.medium,
    },
    userNameText: {
      fontFamily: designTokens.font.bold,
    },
    title: {
      color: colors.heroInk,
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.56,
      fontFamily: designTokens.font.display,
    },
    avatarTapArea: {
      padding: 2,
    },
    avatarBorder: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.avatarBorder,
      backgroundColor: colors.avatarBg,
      alignItems: 'center',
      justifyContent: 'center',
      ...(isDark
        ? {}
        : Platform.select({
            ios: {
              shadowColor: '#2D4263',
              shadowOpacity: 0.14,
              shadowRadius: 8,
              shadowOffset: {width: 0, height: 2},
            },
            android: {elevation: 3},
            default: {},
          })),
    },
    avatarImage: {
      backgroundColor: colors.avatarBg,
    },
    avatarInitial: {
      color: colors.avatarInk,
      fontSize: 16,
      fontFamily: designTokens.font.bold,
    },
  });
}

export default React.memo(CustomAppBar);
