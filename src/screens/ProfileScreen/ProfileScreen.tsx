import React from 'react';
import {View, StyleSheet, Image, ScrollView} from 'react-native';
import {Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {AnimatedLoader} from '@trackingPortal/components';
import {colors} from '@trackingPortal/themes/colors';

const AVATAR_SIZE = 120;
const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aether&backgroundColor=transparent';

const ProfileScreen: React.FC = () => {
  const {user, loading} = useAuth();

  if (loading) {
    return <AnimatedLoader />;
  }

  const displayName = user?.name ?? 'Aether Explorer';
  const displayEmail = user?.email ?? 'hello@aether.finance';
  const avatarSource = user?.picture || user?.profilePicture || DEFAULT_AVATAR;
  const firstName = displayName.split(' ')[0] || 'there';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.avatarWrapper}>
          <Image source={{uri: avatarSource}} style={styles.avatar} />
        </View>
        <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
        <Text style={styles.caption}>
          Welcome back to your financial sanctuary.
        </Text>
      </View>

      <Text style={styles.sectionHeader}>ACCOUNT DETAILS</Text>
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons
              name="account-outline"
              size={20}
              color={colors.text}
            />
          </View>
          <View style={styles.detailTextCol}>
            <Text style={styles.detailLabel}>FULL NAME</Text>
            <Text style={styles.detailValue}>{displayName}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={colors.text}
            />
          </View>
          <View style={styles.detailTextCol}>
            <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.detailValue}>{displayEmail}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(161, 250, 255, 0.08)',
    top: -30,
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 16,
    height: AVATAR_SIZE + 16,
    borderRadius: (AVATAR_SIZE + 16) / 2,
    padding: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
  },
  greeting: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  caption: {
    color: colors.subText,
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    width: '100%',
    color: '#a0aab5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  detailCard: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 28,
    padding: 24,
    gap: 18,
    shadowColor: colors.overlay,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 16},
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    color: '#8a929a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    opacity: 0.4,
  },
});

export default ProfileScreen;
