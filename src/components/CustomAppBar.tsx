import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {getGreeting} from '@trackingPortal/utils/utils';
import dayjs from 'dayjs';
import React from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {Avatar} from 'react-native-paper';
import {colors} from '@trackingPortal/themes/colors';
import {useRouter} from 'expo-router';

const AVATAR_SIZE = 54;

const CustomAppBar: React.FC = () => {
  const {user} = useAuth();
  const router = useRouter();

  const greeting = React.useMemo(() => getGreeting(), []);
  const userName = React.useMemo(
    () => user?.name?.split(' ')[0] ?? 'Admin',
    [user],
  );
  const userPicture = React.useMemo(() => user?.picture ?? '', [user]);
  const userInitials = React.useMemo(() => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    return 'A';
  }, [userName]);
  const todayLabel = React.useMemo(() => dayjs().format('dddd, MMM D'), []);

  const handleProfilePress = React.useCallback(() => {
    router.push('/profile');
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.dateLabel}>{todayLabel}</Text>
        <Text style={styles.appNameText}>
          {greeting}, {userName} 👋
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleProfilePress}
        style={styles.avatarTapArea}
        accessibilityRole="button"
        accessibilityLabel="Open profile">
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarGlow} />
          {userPicture ? (
            <Avatar.Image
              size={AVATAR_SIZE}
              style={styles.avatarImage}
              source={{
                uri: userPicture,
              }}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{userInitials}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    paddingLeft: 2,
  },
  appNameText: {
    color: colors.text,
    fontSize: 22,
    fontFamily: 'Manrope',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dateLabel: {
    color: colors.subText,
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  avatarTapArea: {
    paddingLeft: 12,
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
  },
  avatarGlow: {
    display: 'none',
  },
  avatarImage: {
    zIndex: 1,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bellIconWrapper: {
    padding: 8,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  avatarInitial: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
});

export default React.memo(CustomAppBar);
