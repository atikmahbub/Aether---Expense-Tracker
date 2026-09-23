import { useAuth } from "@trackingPortal/auth/Auth0ProviderWithHistory";
import { AnimatedLoader, ScreenGradient } from "@trackingPortal/components";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import React, { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIVACY_URL = "https://atikmahbub.github.io/aether-privacy-policy/";

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { login, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) return <AnimatedLoader />;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 34,
          paddingBottom: Math.max(insets.bottom, 12) + 22,
        },
      ]}
    >
      <ScreenGradient />
      <View style={styles.intro}>
        <Text style={styles.wordmark}>scalar</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.body}>
          Sign in with Google to sync your wallet across devices.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={login}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <View style={styles.gBadge}>
            <Text style={styles.gText}>G</Text>
          </View>
          <Text style={styles.primaryText}>Continue with Google</Text>
        </Pressable>
        <Text style={styles.notice}>
          We only use your Google account to sign you in and back up your
          data.{" "}
          <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Terms and Privacy Policy
          </Text>
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 22,
      justifyContent: "space-between",
      backgroundColor: colors.heroGradBottom,
    },
    intro: { gap: 10 },
    wordmark: {
      color: colors.heroInk,
      fontFamily: designTokens.font.display,
      fontSize: 22,
      letterSpacing: -0.66,
    },
    title: {
      marginTop: 18,
      color: colors.heroText,
      fontFamily: designTokens.font.display,
      fontSize: 30,
      lineHeight: 35,
      letterSpacing: -0.75,
    },
    body: {
      color: colors.heroTextSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 16,
      lineHeight: 24,
    },
    actions: { gap: 14 },
    primary: {
      height: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      borderRadius: designTokens.radius.full,
      backgroundColor: colors.primaryButtonBg,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    gBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
    },
    gText: { color: "#1F6B4F", fontFamily: designTokens.font.bold, fontSize: 15 },
    primaryText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
    },
    notice: {
      textAlign: "center",
      color: colors.heroTextSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
      lineHeight: 20,
    },
    link: { fontFamily: designTokens.font.semibold, textDecorationLine: "underline" },
  });
}
