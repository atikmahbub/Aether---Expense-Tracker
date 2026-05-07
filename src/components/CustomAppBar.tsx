import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {getGreeting} from '@trackingPortal/utils/utils';
import dayjs from 'dayjs';
import React, {useEffect} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {Avatar} from 'react-native-paper';
import {colors} from '@trackingPortal/themes/colors';
import {useRouter} from 'expo-router';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  useSharedValue,
  withDelay,
  FadeInLeft,
  FadeInRight
} from 'react-native-reanimated';
import {triggerSuccessHaptic} from '@trackingPortal/utils/haptic';

const AVATAR_SIZE = 54;

const CustomAppBar: React.FC = () => {
  const {user} = useAuth();
  const router = useRouter();

  const greeting = React.useMemo(() => getGreeting(), []);
  const userName = React.useMemo(
    () => (user?.name as string)?.split(' ')[0] ?? 'Admin',
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

  const glowValue = useSharedValue(0.15);
  const glowScale = useSharedValue(1.175);
  useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 2000 }),
        withTiming(0.15, { duration: 2000 })
      ),
      2,
      true
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 2000 }),
        withTiming(1.175, { duration: 2000 })
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
          <MaterialCommunityIcons name={timeIcon} size={14} color={colors.primary} />
          <Text style={styles.dateLabel}>{todayLabel.toUpperCase()}</Text>
        </View>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting}, <Text style={styles.userNameText}>{userName}</Text></Text>
        </View>
      </Animated.View>
      
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
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
    marginBottom: 4,
  },
  dateLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'Manrope',
  },
  greetingRow: {
    flexDirection: 'row',
  },
  greetingText: {
    color: colors.subText,
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  userNameText: {
    color: colors.text,
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  avatarTapArea: {
    padding: 4,
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
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  avatarImage: {
    backgroundColor: colors.surfaceAlt,
  },
  avatarGlow: {
    position: 'absolute',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary,
    zIndex: 1,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
});

export default React.memo(CustomAppBar);
