import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as darkColors } from '@trackingPortal/themes/colors';
import { lightColors } from '@trackingPortal/themes/lightColors';
import { darkTheme } from '@trackingPortal/themes/darkTheme';
import { lightTheme } from '@trackingPortal/themes/lightTheme';

export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_STORAGE_KEY = 'app_theme_mode';

type AppColors = typeof darkColors;
interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  paperTheme: typeof darkTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  themeMode: 'system',
  setThemeMode: () => {},
  paperTheme: darkTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setThemeModeState(v);
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemScheme !== 'light';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const value = useMemo(() => ({
    colors: isDark ? darkColors : (lightColors as AppColors),
    isDark,
    themeMode,
    setThemeMode,
    paperTheme: isDark ? darkTheme : lightTheme,
  }), [isDark, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
