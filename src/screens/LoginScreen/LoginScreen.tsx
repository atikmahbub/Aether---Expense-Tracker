import {View, StyleSheet, Image, TouchableOpacity} from 'react-native';
import React from 'react';
import {Text} from 'react-native-paper';
import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {AnimatedLoader, GlassCard} from '@trackingPortal/components';
import {colors} from '@trackingPortal/themes/colors';

const PROGRESS_STEPS = [0, 1, 2];

export default function LoginScreen() {
  const {login, loginWithPasskey, loading} = useAuth();

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandLockup}>
          <View style={styles.brandBadge}>
            <Image
              source={require('../../../assets/screen.png')}
              style={styles.brandIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Aether</Text>
          <Text style={styles.subtitle}>Track your money effortlessly</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            Upgrade your wallet <Text style={styles.heroAccent}>flow</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Sync spending, stay under limits, and feel every interaction with
            gentle haptics and gradients.
          </Text>
        </View>

        <View style={styles.progressRail}>
          {PROGRESS_STEPS.map(step => (
            <View
              key={`progress-${step}`}
              style={[
                styles.progressSegment,
                step === 1 && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.primaryButton}
          onPress={login}>
          <Text style={styles.primaryButtonText}>Log in</Text>
          <Text style={styles.primaryButtonIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 24,
  },
  brandLockup: {
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(196, 127, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(196, 127, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tertiary,
    shadowOpacity: 0.4,
    shadowRadius: 40,
    shadowOffset: {width: 0, height: 12},
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  appName: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  subtitle: {
    color: colors.subText,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  heroCopy: {
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
  },
  heroAccent: {
    color: colors.tertiary,
  },
  heroDescription: {
    color: colors.subText,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  progressRail: {
    width: 160,
    flexDirection: 'row',
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressSegmentActive: {
    backgroundColor: colors.tertiary,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.tertiary,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 16},
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  primaryButtonIcon: {
    color: colors.background,
    fontSize: 18,
    marginLeft: 4,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  showcaseCard: {
    width: '100%',
  },
  showcaseContent: {
    gap: 20,
  },
  showcaseHeader: {
    alignItems: 'center',
    gap: 12,
  },
  showcasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(161, 250, 255, 0.12)',
  },
  showcaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  showcasePillText: {
    color: colors.text,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  showcaseTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  showcaseCopy: {
    color: colors.subText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  showcaseImage: {
    width: '100%',
    height: 140,
  },
  showcaseFooter: {
    marginTop: -4,
    color: colors.subText,
    fontSize: 11,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
