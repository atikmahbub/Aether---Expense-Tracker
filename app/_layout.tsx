import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from "@expo-google-fonts/manrope";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import {
  Auth0ProviderWithHistory,
  useAuth,
} from "@trackingPortal/auth/Auth0ProviderWithHistory";
import { authStorage } from "@trackingPortal/auth/authStorage";
import { AnimatedLoader } from "@trackingPortal/components";
import MigrationOverlay from "@trackingPortal/components/MigrationOverlay";
import OfflineBanner from "@trackingPortal/components/OfflineBanner";
import ScalarSplashGate from "@trackingPortal/components/ScalarSplashGate";
import toastConfig from "@trackingPortal/components/ToastConfig";
import { NetworkProvider } from "@trackingPortal/contexts/NetworkProvider";
import { OfflineProvider } from "@trackingPortal/contexts/OfflineProvider";
import { StoreProvider } from "@trackingPortal/contexts/StoreProvider";
import {
  ThemeProvider,
  useAppTheme,
} from "@trackingPortal/contexts/ThemeContext";
import { DatabaseProvider } from "@trackingPortal/db";
import AppLayout from "@trackingPortal/layout";
import OnboardingScreen from "@trackingPortal/screens/OnboardingScreen";

console.log("🔥 LAYOUT LOADED");

const DEFAULT_AUTHENTICATED_ROUTE = "/(tabs)/transactions";
const LOGIN_ROUTE = "/login";
const ONBOARDING_DONE_KEY = "onboarding_done";

SplashScreen.preventAutoHideAsync().catch(() => {});

const applyDefaultFont = () => {
  const components = [Text, TextInput];
  components.forEach((component) => {
    const target = component as any;
    target.defaultProps = target.defaultProps || {};
    const existingStyle = target.defaultProps.style;
    const fontStyle = { fontFamily: "Manrope_400Regular" };
    if (Array.isArray(existingStyle)) {
      target.defaultProps.style = [...existingStyle, fontStyle];
    } else if (existingStyle) {
      target.defaultProps.style = [existingStyle, fontStyle];
    } else {
      target.defaultProps.style = fontStyle;
    }
  });
};

const NavigationBoundary: React.FC = () => {
  const { isAuthenticated, loading, refreshFailed, retrySession } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const rootSegment = segments[0];
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
        setHasCompletedOnboarding(storedValue === "true");
      } catch (error) {
        console.warn("Failed to read onboarding status", error);
      } finally {
        setOnboardingChecked(true);
      }
    };

    fetchOnboardingStatus();
  }, []);

  const handleOnboardingFinish = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, "true");
      // Clear any stale tokens from a previous session (SecureStore survives
      // iOS reinstalls, so without this the bootstrap would silently re-auth
      // and skip the login screen entirely).
      await authStorage.clearAll();
    } catch (error) {
      console.warn("Failed to persist onboarding completion", error);
    }
    setHasCompletedOnboarding(true);
    router.replace(LOGIN_ROUTE);
  }, [router]);

  useEffect(() => {
    if (
      loading ||
      !onboardingChecked ||
      !hasCompletedOnboarding ||
      refreshFailed
    ) {
      return;
    }

    if (!isAuthenticated) {
      if (rootSegment !== "login") {
        router.replace(LOGIN_ROUTE);
      }
      return;
    }

    if (!rootSegment || rootSegment === "login") {
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
    }
  }, [
    loading,
    isAuthenticated,
    refreshFailed,
    router,
    rootSegment,
    onboardingChecked,
    hasCompletedOnboarding,
  ]);

  if (!onboardingChecked) {
    return <AnimatedLoader />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <AppLayout>
        <OnboardingScreen onFinish={handleOnboardingFinish} />
      </AppLayout>
    );
  }

  if (loading) {
    return <AnimatedLoader />;
  }

  if (!isAuthenticated && rootSegment !== "login" && rootSegment !== "auth") {
    return <AnimatedLoader />;
  }

  if (refreshFailed) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
          padding: 24,
        }}
      >
        <Text
          style={{
            color: colors.text,
            textAlign: "center",
            marginBottom: 24,
            fontSize: 16,
          }}
        >
          Unable to connect. Check your internet and try again.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 8,
          }}
          onPress={retrySession}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          headerTitle: "Profile",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
};

function ThemedApp() {
  const { paperTheme, isDark, colors } = useAppTheme();

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaProvider style={{ backgroundColor: colors.background }}>
        <PaperProvider theme={paperTheme}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Auth0ProviderWithHistory>
            <DatabaseProvider>
              <StoreProvider>
                <NetworkProvider>
                  <OfflineProvider>
                    {Platform.OS === "ios" ? (
                      <KeyboardAvoidingView
                        behavior="padding"
                        style={{ flex: 1, backgroundColor: colors.background }}
                      >
                        <NavigationBoundary />
                        <OfflineBanner />
                        <MigrationOverlay />
                      </KeyboardAvoidingView>
                    ) : (
                      <>
                        <NavigationBoundary />
                        <OfflineBanner />
                        <MigrationOverlay />
                      </>
                    )}
                  </OfflineProvider>
                </NetworkProvider>
              </StoreProvider>
            </DatabaseProvider>
          </Auth0ProviderWithHistory>
        </PaperProvider>
      </SafeAreaProvider>

      <Toast topOffset={70} position="top" config={toastConfig} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFont();
    }
  }, [fontsLoaded]);

  // useEffect(() => {
  //   const requestPermissions = async () => {
  //     try {
  //       // const settings = await notifee.requestPermission();
  //       // if (settings.authorizationStatus === 1) {
  //       //   console.log("Notification permission granted.");
  //       // } else {
  //       //   console.log("Notification permission denied.");
  //       // }
  //     } catch (error) {
  //       console.warn("Failed to request notification permissions", error);
  //     }
  //   };

  //   requestPermissions();
  // }, []);

  return (
    <ThemeProvider>
      {!splashComplete ? (
        <ScalarSplashGate
          fontsLoaded={!!fontsLoaded}
          onComplete={() => setSplashComplete(true)}
        />
      ) : (
        <ThemedApp />
      )}
    </ThemeProvider>
  );
}
