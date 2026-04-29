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
import React, { useCallback, useEffect, useState } from "react";
import { Text, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import {
  Auth0ProviderWithHistory,
  useAuth,
} from "@trackingPortal/auth/Auth0ProviderWithHistory";
import { AnimatedLoader } from "@trackingPortal/components";
import OfflineBanner from '@trackingPortal/components/OfflineBanner';
import toastConfig from '@trackingPortal/components/ToastConfig';
import { NetworkProvider } from '@trackingPortal/contexts/NetworkProvider';
import { StoreProvider } from '@trackingPortal/contexts/StoreProvider';
import { OfflineProvider } from '@trackingPortal/contexts/OfflineProvider';
import AppLayout from '@trackingPortal/layout';
import OnboardingScreen from '@trackingPortal/screens/OnboardingScreen';
import { colors } from '@trackingPortal/themes/colors';
import { darkTheme } from '@trackingPortal/themes/darkTheme';

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
  const { token, loading } = useAuth();
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
    } catch (error) {
      console.warn("Failed to persist onboarding completion", error);
    }
    setHasCompletedOnboarding(true);
    router.replace(token ? DEFAULT_AUTHENTICATED_ROUTE : LOGIN_ROUTE);
  }, [router, token]);

  useEffect(() => {
    if (loading || !onboardingChecked || !hasCompletedOnboarding) {
      return;
    }

    if (!token) {
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
    token,
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFont();
      SplashScreen.hideAsync();
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={darkTheme}>
          <Auth0ProviderWithHistory>
            <StoreProvider>
              <NetworkProvider>
                <OfflineProvider>
                  {Platform.OS === 'ios' ? (
                    <KeyboardAvoidingView
                      behavior="padding"
                      style={{ flex: 1 }}
                    >
                      <NavigationBoundary />
                      <OfflineBanner />
                    </KeyboardAvoidingView>
                  ) : (
                    <>
                      <NavigationBoundary />
                      <OfflineBanner />
                    </>
                  )}
                </OfflineProvider>
              </NetworkProvider>
            </StoreProvider>
          </Auth0ProviderWithHistory>
        </PaperProvider>
      </SafeAreaProvider>

      <Toast topOffset={70} position="top" config={toastConfig} />
    </GestureHandlerRootView>
  );
}
