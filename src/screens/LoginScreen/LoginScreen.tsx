import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "@trackingPortal/auth/Auth0ProviderWithHistory";
import { AnimatedLoader } from "@trackingPortal/components";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React, { useMemo } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FEATURES = [
  {
    icon: "shield-check" as const,
    title: "Private",
    detail: "Secure account access",
  },
  {
    icon: "lightning-bolt" as const,
    title: "Fast",
    detail: "Capture entries quickly",
  },
  {
    icon: "cloud-check" as const,
    title: "Offline",
    detail: "Sync when reconnected",
  },
];

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { login, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) return <AnimatedLoader />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 20,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>S</Text>
        </View>
        <Text style={styles.brandName}>Scalar</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons
            name="wallet"
            size={34}
            color={colors.onBrand}
          />
        </View>
        <Text style={styles.eyebrow}>YOUR MONEY, MADE CLEAR</Text>
        <Text style={styles.heroTitle}>Stay on top of every taka.</Text>
        <Text style={styles.heroDescription}>
          Track spending, income, loans, and investments in one calm,
          dependable workspace.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature, index) => (
          <View key={feature.title}>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={20}
                  color={colors.brandText}
                />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDetail}>{feature.detail}</Text>
              </View>
            </View>
            {index < FEATURES.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={login}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Continue securely</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={colors.onBrand}
          />
        </Pressable>
        <Text style={styles.legalNotice}>
          By continuing, you agree to our{" "}
          <Text
            style={styles.legalLink}
            onPress={() =>
              Linking.openURL(
                "https://atikmahbub.github.io/aether-privacy-policy/",
              )
            }
          >
            Terms and Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      gap: 20,
    },
    brandRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    brandMark: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.brand,
    },
    brandMarkText: {
      color: colors.onBrand,
      fontFamily: designTokens.font.bold,
      fontSize: 17,
      fontWeight: "700",
    },
    brandName: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 18,
      fontWeight: "700",
    },
    heroCard: {
      minHeight: 310,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    heroIcon: {
      width: 72,
      height: 72,
      marginBottom: 4,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.lg,
      backgroundColor: colors.brand,
    },
    eyebrow: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      textAlign: "center",
      ...designTokens.typography.caps,
    },
    heroTitle: {
      maxWidth: 300,
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 30,
      lineHeight: 37,
      fontWeight: "700",
      letterSpacing: -0.6,
      textAlign: "center",
    },
    heroDescription: {
      maxWidth: 310,
      color: colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
      lineHeight: 23,
      textAlign: "center",
    },
    features: {
      overflow: "hidden",
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    featureRow: {
      minHeight: 64,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    featureIcon: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.brandWash,
    },
    featureCopy: { flex: 1 },
    featureTitle: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
      fontWeight: "600",
    },
    featureDetail: {
      marginTop: 2,
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
      fontWeight: "500",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 68,
      backgroundColor: colors.divider,
    },
    actions: { marginTop: "auto", gap: 14 },
    primaryButton: {
      height: 54,
      paddingHorizontal: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.brand,
    },
    primaryButtonPressed: { backgroundColor: colors.brandText },
    primaryButtonText: {
      color: colors.onBrand,
      fontFamily: designTokens.font.bold,
      fontSize: 16,
      fontWeight: "700",
    },
    legalNotice: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
    },
    legalLink: {
      color: colors.brandText,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
  });
}
