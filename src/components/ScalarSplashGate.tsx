import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import ScalarSplashScreen from '@trackingPortal/components/ScalarSplashScreen';
import { SPLASH_THEME } from '@trackingPortal/constants/splash';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

const MIN_SPLASH_MS = 900;

type ScalarSplashGateProps = {
  fontsLoaded: boolean;
  onComplete: () => void;
};

const ScalarSplashGate: React.FC<ScalarSplashGateProps> = ({ fontsLoaded, onComplete }) => {
  const { isDark } = useAppTheme();
  const palette = isDark ? SPLASH_THEME.dark : SPLASH_THEME.light;

  const [exiting, setExiting] = useState(false);
  const nativeHiddenRef = useRef(false);
  const readyAtRef = useRef<number | null>(null);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.background).catch(() => {});
  }, [palette.background]);

  const handleSplashLayout = useCallback(() => {
    if (nativeHiddenRef.current) return;
    nativeHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    readyAtRef.current = Date.now();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded || readyAtRef.current === null) return;

    const elapsed = Date.now() - readyAtRef.current;
    const delay = Math.max(0, MIN_SPLASH_MS - elapsed);

    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(onComplete, 340);
    }, delay);

    return () => clearTimeout(exitTimer);
  }, [fontsLoaded, onComplete]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScalarSplashScreen
        isDark={isDark}
        fontsLoaded={fontsLoaded}
        exiting={exiting}
        onLayout={handleSplashLayout}
      />
    </View>
  );
};

export default ScalarSplashGate;
