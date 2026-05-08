import {View, StyleSheet, Image, TouchableOpacity, ScrollView, Linking} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React from 'react';
import {Text} from 'react-native-paper';
import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {AnimatedLoader} from '@trackingPortal/components';
import {colors} from '@trackingPortal/themes/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PROGRESS_STEPS = [0, 1, 2];

export default function LoginScreen() {
  const {login, loading} = useAuth();
  const insets = useSafeAreaInsets();

  const handleTermsOfService = async () => {
    const url = 'https://atikmahbub.github.io/aether-privacy-policy/';
    try {
      await Linking.openURL(url);
    } catch {
      // Silently fail or add a toast if needed
    }
  };

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topGlow} />
      
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandLockup}>
          <View style={styles.brandBadge}>
            <Image
              source={require('../../../assets/screen.png')}
              style={styles.brandIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>SCALAR</Text>
          <Text style={styles.subtitle}>ELEVATED FINANCE</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            Master your <Text style={styles.heroAccent}>wealth</Text> with precision
          </Text>
          <Text style={styles.heroDescription}>
            The minimalist workspace for your personal economy. Beautiful analytics, 
            instant tracking, and zero friction.
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>SECURE</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="lightning-bolt-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>FAST</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="chart-arc" size={20} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>SMART</Text>
          </View>
        </View>

        <View style={styles.footerAction}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButton}
            onPress={login}>
            <Text style={styles.primaryButtonText}>GET STARTED</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.background} />
          </TouchableOpacity>
          <Text style={styles.legalNotice}>
            By signing in, you agree to our{' '}
            <Text style={styles.legalLink} onPress={handleTermsOfService}>Terms of Service</Text>.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topGlow: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(34, 197, 94, 0.03)',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 48,
  },
  brandLockup: {
    alignItems: 'center',
    gap: 16,
  },
  brandBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: {width: 0, height: 10},
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  appName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -4,
  },
  heroCopy: {
    alignItems: 'center',
    gap: 16,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -1,
  },
  heroAccent: {
    color: colors.primary,
  },
  heroDescription: {
    color: colors.subText,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  featureText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerAction: {
    width: '100%',
    gap: 20,
    marginTop: 'auto',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  legalNotice: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  legalLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
